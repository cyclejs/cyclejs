'use strict';
let Rx = require('rx');
let {createStream} = require('./stream');
require('string.prototype.endswith');

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

function subscribeDispatchers(element, eventStreams) {
  if (!eventStreams || typeof eventStreams !== 'object') { return; }

  var disposables = new Rx.CompositeDisposable();
  for (let streamName in eventStreams) { if (eventStreams.hasOwnProperty(streamName)) {
    if (streamName.endsWith('$') &&
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
  if (!eventStreams || typeof eventStreams !== 'object') { return; }

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

class PropertiesProxy {
  constructor() {
    this.type = 'PropertiesProxy';
    this.proxiedProps = {};
  }

  get(streamKey, distinctnessComparer = Rx.helpers.defaultComparer) {
    if (typeof this.proxiedProps[streamKey] === 'undefined') {
      this.proxiedProps[streamKey] = new Rx.Subject();
    }
    return this.proxiedProps[streamKey]
      .distinctUntilChanged(Rx.helpers.identity, distinctnessComparer);
  }
}

function createContainerElement(tagName, vtreeProperties) {
  let element = document.createElement('div');
  element.id = vtreeProperties.id || '';
  element.className = vtreeProperties.className || '';
  element.className += ' cycleCustomElement-' + tagName.toUpperCase();
  return element;
}

function replicate(origin, destination) {
  origin.subscribe(elem => destination.onNext(elem));
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
    this.type = 'Widget';
    this.properties = vtree.properties;
    throwIfVTreeHasPropertyChildren(vtree);
    this.properties.children = vtree.children;
    this.key = vtree.key;
    this._rootElem$ = new Rx.ReplaySubject(1);
  };
}

function makeInit(tagName, definitionFn) {
  let {render} = require('./render');
  return function initCustomElement() {
    //console.log('%cInit() custom element ' + tagName, 'color: #880088');
    let widget = this;
    let element = createContainerElement(tagName, widget.properties);
    element.cycleCustomElementRoot$ = createStream(vtree$ => render(vtree$, element));
    element.cycleCustomElementProperties = new PropertiesProxy();
    let eventStreams = definitionFn(
      element.cycleCustomElementRoot$,
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
    if (element.cycleCustomElementProperties.type !== 'PropertiesProxy') { return; }
    if (!element.cycleCustomElementProperties.proxiedProps) { return; }

    //console.log('%cupdate() custom element ' + element.className, 'color: #880088');
    replicate(element.cycleCustomElementRoot$, this._rootElem$);
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
  makeConstructor,
  makeInit,
  makeUpdate
};
