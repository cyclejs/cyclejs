'use strict';
let InputProxy = require('./input-proxy');
let Rx = require('rx');

function endsWithDollarSign(str) {
  if (typeof str !== 'string') {
    return false;
  }
  return str.indexOf('$', str.length - 1) !== -1;
}

function makeDispatchFunction(element, eventName) {
  return function dispatchCustomEvent(evData) {
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

function subscribeDispatchers(element, eventStreams) {
  if (!eventStreams || typeof eventStreams !== 'object') { return; }

  var disposables = new Rx.CompositeDisposable();
  for (let streamName in eventStreams) { if (eventStreams.hasOwnProperty(streamName)) {
    if (endsWithDollarSign(streamName) &&
      typeof eventStreams[streamName].subscribe === 'function')
    {
      let eventName = streamName.slice(0, -1);
      let disposable = eventStreams[streamName].subscribe(
        makeDispatchFunction(element, eventName)
      );
      disposables.add(disposable);
    }
  }}
  return disposables;
}

function subscribeDispatchersWhenRootChanges(widget, eventStreams) {
  widget._rootElem$
    .distinctUntilChanged(Rx.helpers.identity,
      (x, y) => (x && y && x.isEqualNode && x.isEqualNode(y))
    )
    .subscribe(function (rootElem) {
      if (widget.eventStreamsSubscriptions) {
        widget.eventStreamsSubscriptions.dispose();
      }
      widget.eventStreamsSubscriptions = subscribeDispatchers(rootElem, eventStreams);
    });
}

function makeInputPropertiesProxy() {
  let inputProxy = new InputProxy();
  let oldGet = inputProxy.get;
  inputProxy.get = function get(streamName) {
    let result = oldGet.call(this, streamName);
    if (result && result.distinctUntilChanged) {
      return result.distinctUntilChanged();
    } else {
      return result;
    }
  };
  return inputProxy;
}

function createContainerElement(tagName, vtreeProperties) {
  let element = document.createElement('div');
  element.className = vtreeProperties.className || '';
  element.id = vtreeProperties.id || '';
  element.className += ' cycleCustomElement-' + tagName.toUpperCase();
  return element;
}

function replicateUserRootElem$(origin, destination) {
  origin._rootElem$.subscribe(elem => destination._rootElem$.onNext(elem));
}

function makeConstructor() {
  return function customElementConstructor(vtree) {
    //console.log('%cnew (constructor) custom element ' + vtree.tagName,
    //  'color: #880088');
    this.type = 'Widget';
    this.properties = vtree.properties;
    this.key = vtree.key;
    this._rootElem$ = new Rx.ReplaySubject(1);
  };
}

function makeInit(tagName, definitionFn) {
  let DOMUser = require('./dom-user');
  return function initCustomElement() {
    //console.log('%cInit() custom element ' + tagName, 'color: #880088');
    let widget = this;
    let element = createContainerElement(tagName, widget.properties);
    element.cycleCustomElementDOMUser = new DOMUser(element);
    element.cycleCustomElementProperties = makeInputPropertiesProxy();
    let eventStreams = definitionFn(
      element.cycleCustomElementDOMUser,
      element.cycleCustomElementProperties
    );
    widget.eventStreamsSubscriptions = subscribeDispatchers(element, eventStreams);
    subscribeDispatchersWhenRootChanges(widget, eventStreams);
    widget.update(null, element);
    return element;
  };
}

function makeUpdate() {
  return function updateCustomElement(previous, element) {
    if (!element) { return; }
    if (!element.cycleCustomElementProperties) { return; }
    if (!(element.cycleCustomElementProperties instanceof InputProxy)) { return; }
    if (!element.cycleCustomElementProperties.proxiedProps) { return; }

    //console.log('%cupdate() custom element ' + element.className, 'color: #880088');
    replicateUserRootElem$(element.cycleCustomElementDOMUser, this);
    let proxiedProps = element.cycleCustomElementProperties.proxiedProps;
    for (let prop in proxiedProps) { if (proxiedProps.hasOwnProperty(prop)) {
      let propStreamName = prop;
      let propName = prop.slice(0, -1);
      if (this.properties.hasOwnProperty(propName)) {
        proxiedProps[propStreamName].onNext(this.properties[propName]);
      }
    }}
  };
}

module.exports = {
  makeConstructor: makeConstructor,
  makeInit: makeInit,
  makeUpdate: makeUpdate
};
