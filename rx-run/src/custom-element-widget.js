'use strict';
let Rx = require('rx');
const ALL_PROPS = '*';
const DOM_ADAPTER_NAME = 'dom';
const PROPS_ADAPTER_NAME = 'props';
const EVENTS_SINK_NAME = 'events';

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
    event.detail = evData;
    element.dispatchEvent(event);
  };
}

function subscribeDispatchers(element) {
  let {customEvents} = element.cycleCustomElementMetadata;
  let disposables = new Rx.CompositeDisposable();
  for (let name in customEvents) { if (customEvents.hasOwnProperty(name)) {
    if (typeof customEvents[name].subscribe === 'function') {
      let disposable = customEvents[name].subscribe(
        makeDispatchFunction(element, name)
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
    .subscribe(function resubscribeDispatchers(rootElem) {
      if (metadata.eventDispatchingSubscription) {
        metadata.eventDispatchingSubscription.dispose();
      }
      metadata.eventDispatchingSubscription = subscribeDispatchers(rootElem);
    });
}

function subscribeEventDispatchingSink(element, widget) {
  element.cycleCustomElementMetadata.eventDispatchingSubscription =
    subscribeDispatchers(element);
  widget.disposables.add(
    element.cycleCustomElementMetadata.eventDispatchingSubscription
  );
  widget.disposables.add(
    subscribeDispatchersWhenRootChanges(element.cycleCustomElementMetadata)
  );
}

function makePropertiesAdapter() {
  let propertiesAdapter = {};
  let defaultComparer = Rx.helpers.defaultComparer;
  Object.defineProperty(propertiesAdapter, 'type', {
    enumerable: false,
    value: 'PropertiesAdapter'
  });
  // TODO Test get() with no params should return all props as an object stream
  Object.defineProperty(propertiesAdapter, 'get', {
    enumerable: false,
    value: function get(streamKey = ALL_PROPS, comparer = defaultComparer) {
      if (typeof this[streamKey] === 'undefined') {
        this[streamKey] = new Rx.ReplaySubject(1);
      }
      return this[streamKey]
        .distinctUntilChanged(Rx.helpers.identity, comparer);
    }
  });
  return propertiesAdapter;
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
    console.warn('Missing `key` property for Cycle custom element ' +
      vtree.tagName);
  }
}

function throwIfVTreeHasPropertyChildren(vtree) {
  if (typeof vtree.properties.children !== 'undefined') {
    throw new Error('Custom element should not have property `children`. ' +
      'It is reserved for children elements nested into this custom element.');
  }
}

function makeCustomElementInput(domOutput, propertiesAdapter) {
  return {
    get(adapterName, ...params) {
      if (adapterName === DOM_ADAPTER_NAME) {
        return domOutput.get.apply(null, params);
      } else if (adapterName === PROPS_ADAPTER_NAME) {
        return propertiesAdapter.get.apply(propertiesAdapter, params);
      } else {
        throw new Error(`No such internal adapter named '${adapterName}' for ` +
          `custom elements. Use '${DOM_ADAPTER_NAME}' or `
            `'${PROPS_ADAPTER_NAME}' instead.`);
      }
    }
  };
}

function makeConstructor() {
  return function customElementConstructor(vtree, customElementsRegistry) {
    //console.log('%cnew (constructor) custom element ' + vtree.tagName,
    //  'color: #880088');
    warnIfVTreeHasNoKey(vtree);
    throwIfVTreeHasPropertyChildren(vtree);
    this.type = 'Widget';
    this.properties = vtree.properties;
    this.properties.children = vtree.children;
    this.key = vtree.key;
    this.isCustomElementWidget = true;
    this.customElementsRegistry = customElementsRegistry;
    this.firstRootElem$ = new Rx.ReplaySubject(1);
    this.disposables = new Rx.CompositeDisposable();
  };
}

function validateDefFnOutput(defFnOutput) {
  if (typeof defFnOutput !== 'object') {
    throw new Error('Custom element definition function should output an ' +
      'object.');
  }
  if (typeof defFnOutput.dom === 'undefined') {
    throw new Error('Custom element definition function should output an ' +
      'object containing `dom`.');
  }
  if (typeof defFnOutput.dom.subscribe !== 'function') {
    throw new Error('Custom element definition function should output an ' +
      'object containing an Observable of VTree, named `dom`.');
  }
  for (let name in defFnOutput) { if (defFnOutput.hasOwnProperty(name)) {
    if (name !== DOM_ADAPTER_NAME && name !== EVENTS_SINK_NAME) {
      throw new Error(`Unknown '${name}' found on custom element definition ` +
        `function's output.`);
    }
  }}
}

function makeInit(tagName, definitionFn) {
  let {makeDOMAdapterWithRegistry} = require('./render-dom');
  return function initCustomElement() {
    //console.log('%cInit() custom element ' + tagName, 'color: #880088');
    let widget = this;
    let registry = widget.customElementsRegistry;
    let element = createContainerElement(tagName, widget.properties);
    let proxyVTree$$ = new Rx.AsyncSubject();
    let domAdapter = makeDOMAdapterWithRegistry(element, registry);
    let propertiesAdapter = makePropertiesAdapter();
    let domOutput = domAdapter(proxyVTree$$.mergeAll());
    let defFnInput = makeCustomElementInput(domOutput, propertiesAdapter);
    let defFnOutput = definitionFn(defFnInput);
    validateDefFnOutput(defFnOutput);
    proxyVTree$$.onNext(defFnOutput.dom.shareReplay(1));
    proxyVTree$$.onCompleted();
    domOutput.get(':root').subscribe(widget.firstRootElem$.asObserver());
    element.cycleCustomElementMetadata = {
      propertiesAdapter,
      rootElem$: domOutput.get(':root'),
      customEvents: defFnOutput.events,
      eventDispatchingSubscription: false
    };
    subscribeEventDispatchingSink(element, widget);
    //widget.disposables.add(domOutput.someDisposable); // TODO?
    widget.disposables.add(widget.firstRootElem$);
    widget.update(null, element);
    return element;
  };
}

function validatePropertiesAdapterInMetadata(element, fnName) {
  if (!element) {
    throw new Error(`Missing DOM element when calling ${fnName} on custom ` +
      'element Widget.');
  }
  if (!element.cycleCustomElementMetadata) {
    throw new Error('Missing custom element metadata on DOM element when ' +
      'calling ' + fnName + ' on custom element Widget.');
  }
  let metadata = element.cycleCustomElementMetadata;
  if (metadata.propertiesAdapter.type !== 'PropertiesAdapter') {
    throw new Error('Custom element metadata\'s propertiesAdapter type is ' +
      'invalid: ' + metadata.propertiesAdapter.type + '.');
  }
}

function updateCustomElement(previous, element) {
  if (previous) {
    this.disposables = previous.disposables;
    this.firstRootElem$.onNext(0);
    this.firstRootElem$.onCompleted();
  }
  validatePropertiesAdapterInMetadata(element, 'update()');

  //console.log(`%cupdate() ${element.className}`, 'color: #880088');
  let propsAdapter = element.cycleCustomElementMetadata.propertiesAdapter;
  if (propsAdapter.hasOwnProperty(ALL_PROPS)) {
    propsAdapter[ALL_PROPS].onNext(this.properties);
  }
  for (let prop in propsAdapter) { if (propsAdapter.hasOwnProperty(prop)) {
    if (this.properties.hasOwnProperty(prop)) {
      propsAdapter[prop].onNext(this.properties[prop]);
    }
  }}
}

function destroyCustomElement(element) {
  //console.log(`%cdestroy() custom el ${element.className}`, 'color: #808');
  // Dispose propertiesAdapter
  let propsAdapter = element.cycleCustomElementMetadata.propertiesAdapter;
  for (let prop in propsAdapter) { if (propsAdapter.hasOwnProperty(prop)) {
    this.disposables.add(propsAdapter[prop]);
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
}

function makeWidgetClass(tagName, definitionFn) {
  if (typeof tagName !== 'string' || typeof definitionFn !== 'function') {
    throw new Error('registerCustomElement requires parameters `tagName` and ' +
      '`definitionFn`.');
  }

  let WidgetClass = makeConstructor();
  WidgetClass.definitionFn = definitionFn; // needed by renderAsHTML
  WidgetClass.prototype.init = makeInit(tagName, definitionFn);
  WidgetClass.prototype.update = updateCustomElement;
  WidgetClass.prototype.destroy = destroyCustomElement;
  return WidgetClass;
}

module.exports = {
  makeDispatchFunction,
  subscribeDispatchers,
  subscribeDispatchersWhenRootChanges,
  makePropertiesAdapter,
  createContainerElement,
  warnIfVTreeHasNoKey,
  throwIfVTreeHasPropertyChildren,
  makeConstructor,
  makeInit,
  updateCustomElement,
  destroyCustomElement,

  makeWidgetClass
};
