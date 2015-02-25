'use strict';
var InputProxy = require('./input-proxy');
var Utils = require('./utils');
var Rx = require('rx');

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
  if (!eventStreams || eventStreams === null || typeof eventStreams !== 'object') {
    return;
  }
  var disposables = new Rx.CompositeDisposable();
  for (var streamName in eventStreams) {
    if (eventStreams.hasOwnProperty(streamName) &&
      Utils.endsWithDolarSign(streamName) &&
      typeof eventStreams[streamName].subscribe === 'function')
    {
      var eventName = streamName.slice(0, -1);
      var disposable = eventStreams[streamName].subscribe(
        makeDispatchFunction(element, eventName)
      );
      disposables.add(disposable);
    }
  }
  return disposables;
}

function subscribeDispatchersWhenRootChanges(widget, eventStreams) {
  widget._rootElem$
    .distinctUntilChanged(Rx.helpers.identity,
      function comparer(x, y) { return x && y && x.isEqualNode && x.isEqualNode(y); }
    )
    .subscribe(function (rootElem) {
      if (widget.eventStreamsSubscriptions) {
        widget.eventStreamsSubscriptions.dispose();
      }
      widget.eventStreamsSubscriptions = subscribeDispatchers(rootElem, eventStreams);
    });
}

function createContainerElement(tagName, vtreeProperties) {
  var elem = document.createElement('div');
  elem.className = vtreeProperties.className || '';
  elem.id = vtreeProperties.id || '';
  elem.className += ' cycleCustomElement-' + tagName.toUpperCase();
  elem.cycleCustomElementProperties = new InputProxy();
  return elem;
}

function replicateUserRootElem$(user, widget) {
  user._rootElem$.subscribe(function (elem) { widget._rootElem$.onNext(elem); });
}

function makeConstructor() {
  return function customElementConstructor(vtree) {
    this.type = 'Widget';
    this.properties = vtree.properties;
    this._rootElem$ = new Rx.ReplaySubject(1);
  };
}

function makeInit(tagName, definitionFn) {
  var DOMUser = require('./dom-user');
  return function initCustomElement() {
    console.debug('## custom element init ##');
    var widget = this;
    var element = createContainerElement(tagName, widget.properties);
    var user = new DOMUser(element);
    var eventStreams = definitionFn(user, element.cycleCustomElementProperties);
    replicateUserRootElem$(user, widget);
    widget.eventStreamsSubscriptions = subscribeDispatchers(element, eventStreams);
    subscribeDispatchersWhenRootChanges(widget, eventStreams);
    widget.update(null, element);
    return element;
  };
}

function makeUpdate() {
  return function updateCustomElement(prev, elem) {
    console.debug('## custom element update ##');
    if (!elem ||
      !elem.cycleCustomElementProperties ||
      !(elem.cycleCustomElementProperties instanceof InputProxy) ||
      !elem.cycleCustomElementProperties.proxiedProps)
    {
      return;
    }
    var proxiedProps = elem.cycleCustomElementProperties.proxiedProps;
    for (var prop in proxiedProps) {
      if (proxiedProps.hasOwnProperty(prop)) {
        var propStreamName = prop;
        var propName = prop.slice(0, -1);
        if (this.properties.hasOwnProperty(propName)) {
          proxiedProps[propStreamName].onNext(this.properties[propName]);
        }
      }
    }
  };
}

module.exports = {
  makeConstructor: makeConstructor,
  makeInit: makeInit,
  makeUpdate: makeUpdate
};
