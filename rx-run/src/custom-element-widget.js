'use strict';
let Rx = require('rx');

function makeDispatchFunction(element, eventName) {
  return function dispatchCustomEvent(evData) {
    //console.log('%cdispatchCustomEvent ' + eventName,
    //  'background-color: #CCCCFF; color: black');
    var event;
    try {
      event = new Event(eventName);
    } catch (err) {
      event = document.createEvent('Event');
      event.initEvent(eventName, true, true);
    }
    event.data = evData;
    element.dispatchEvent(event);
  };
}

function subscribeDispatchers(element) {
  let {customEvents} = element.cycleCustomElementMetadata;
  let disposables = new Rx.CompositeDisposable();
  for (let streamName in customEvents) { if (customEvents.hasOwnProperty(streamName)) {
    if (/\$$/.test(streamName) &&
      streamName !== 'vtree$' &&
      typeof customEvents[streamName].subscribe === 'function')
    {
      let eventName = streamName.slice(0, -1);
      let disposable = customEvents[streamName].subscribe(
        makeDispatchFunction(element, eventName)
      );
      disposables.add(disposable);
    }
  }}
  return disposables;
}

function subscribeDispatchersWhenRootChanges(metadata) {
  return metadata.rootElem$
    .distinctUntilChanged(Rx.helpers.identity,
      (x, y) => (x && y && x.isEqualNode && x.isEqualNode(y))
    )
    .subscribe(function (rootElem) {
      if (metadata.eventDispatchingSubscription) {
        metadata.eventDispatchingSubscription.dispose();
      }
      metadata.eventDispatchingSubscription = subscribeDispatchers(rootElem);
    });
}

function makePropertiesProxy() {
  let propertiesProxy = {};
  Object.defineProperty(propertiesProxy, 'type', {
    enumerable: false,
    value: 'PropertiesProxy'
  });
  Object.defineProperty(propertiesProxy, 'get', {
    enumerable: false,
    value: function get(streamKey, comparer = Rx.helpers.defaultComparer) {
      if (typeof this[streamKey] === 'undefined') {
        this[streamKey] = new Rx.ReplaySubject(1);
      }
      return this[streamKey]
        .distinctUntilChanged(Rx.helpers.identity, comparer);
    }
  });
  return propertiesProxy;
}

function createContainerElement(tagName, vtreeProperties) {
  let element = document.createElement('div');
  element.id = vtreeProperties.id || '';
  element.className = vtreeProperties.className || '';
  element.className += ' cycleCustomElement-' + tagName.toUpperCase();
  return element;
}

function warnIfVTreeHasNoKey(vtree) {
  if (typeof vtree.key === 'undefined') {
    console.warn('Missing `key` property for Cycle custom element ' + vtree.tagName);
  }
}

function throwIfVTreeHasPropertyChildren(vtree) {
  if (typeof vtree.properties.children !== 'undefined') {
    throw new Error('Custom element should not have property `children`. This is ' +
      'reserved for children elements nested into this custom element.');
  }
}

function makeConstructor() {
  return function customElementConstructor(vtree) {
    //console.log('%cnew (constructor) custom element ' + vtree.tagName,
    //  'color: #880088');
    warnIfVTreeHasNoKey(vtree);
    throwIfVTreeHasPropertyChildren(vtree);
    this.type = 'Widget';
    this.properties = vtree.properties;
    this.properties.children = vtree.children;
    this.key = vtree.key;
    this.isCustomElementWidget = true;
    this.rootElem$ = new Rx.ReplaySubject(1);
    this.disposables = new Rx.CompositeDisposable();
  };
}

function makeInit(tagName, definitionFn) {
  let {applyToDOM} = require('./render-dom');
  return function initCustomElement() {
    //console.log('%cInit() custom element ' + tagName, 'color: #880088');
    let widget = this;
    let element = createContainerElement(tagName, widget.properties);
    let propertiesProxy = makePropertiesProxy();
    let domUI = applyToDOM(
      element,
      definitionFn,
      widget.rootElem$.asObserver(),
      propertiesProxy
    );
    element.cycleCustomElementMetadata = {
      propertiesProxy,
      rootElem$: domUI.rootElem$,
      customEvents: domUI.customEvents,
      eventDispatchingSubscription: false
    };
    element.eventDispatchingSubscription = subscribeDispatchers(element);
    widget.disposables.add(
      element.eventDispatchingSubscription
    );
    widget.disposables.add(
      subscribeDispatchersWhenRootChanges(element.cycleCustomElementMetadata)
    );
    widget.update(null, element);

    widget.disposables.add(domUI);
    widget.disposables.add(widget.rootElem$);

    return element;
  };
}

function validatePropertiesProxyInMetadata(element, fnName) {
  if (!element) {
    throw new Error(`Missing DOM element when calling ${fnName} on custom ` +
      'element Widget.');
  }
  if (!element.cycleCustomElementMetadata) {
    throw new Error('Missing custom element metadata on DOM element when ' +
      'calling ' + fnName + ' on custom element Widget.');
  }
  let metadata = element.cycleCustomElementMetadata;
  if (metadata.propertiesProxy.type !== 'PropertiesProxy') {
    throw new Error('Custom element metadata\'s propertiesProxy type is ' +
      'invalid: ' + metadata.propertiesProxy.type + '.');
  }
}

function makeUpdate() {
  return function updateCustomElement(previous, element) {
    if (previous) {
      this.disposables = previous.disposables;
      // This is a new rootElem$ which is not being used by init(),
      // but used by render-dom for creating rootElemAfterChildren$.
      this.rootElem$.onNext(null);
      this.rootElem$.onCompleted();
    }
    validatePropertiesProxyInMetadata(element, 'update()');

    //console.log('%cupdate() custom element ' + element.className, 'color: #880088');
    let proxiedProps = element.cycleCustomElementMetadata.propertiesProxy;
    for (let prop in proxiedProps) { if (proxiedProps.hasOwnProperty(prop)) {
      if (this.properties.hasOwnProperty(prop)) {
        proxiedProps[prop].onNext(this.properties[prop]);
      }
    }}
  };
}

function makeDestroy() {
  return function destroyCustomElement(element) {
    // Dispose propertiesProxy
    let proxiedProps = element.cycleCustomElementMetadata.propertiesProxy;
    for (let prop in proxiedProps) { if (proxiedProps.hasOwnProperty(prop)) {
      this.disposables.add(proxiedProps[prop]);
    }}

    if (element.cycleCustomElementMetadata.eventDispatchingSubscription) {
      // This subscription has to be disposed.
      // Because disposing subscribeDispatchersWhenRootChanges only
      // is not enough.
      this.disposables.add(
        element.cycleCustomElementMetadata.eventDispatchingSubscription
      );
    }

    this.disposables.dispose();
  };
}

module.exports = {
  makeDispatchFunction,
  subscribeDispatchers,
  subscribeDispatchersWhenRootChanges,
  makePropertiesProxy,
  createContainerElement,
  warnIfVTreeHasNoKey,
  throwIfVTreeHasPropertyChildren,

  makeConstructor,
  makeInit,
  makeUpdate,
  makeDestroy
};
