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

function subscribeDispatchersWhenRootChanges(user, widget, eventStreams) {
  user._rootNode$
    .distinctUntilChanged(Rx.helpers.identity,
      function comparer(x, y) { return x && y && x.isEqualNode && x.isEqualNode(y); }
    )
    .subscribe(function (rootNode) {
      if (widget.eventStreamsSubscriptions) {
        widget.eventStreamsSubscriptions.dispose();
      }
      widget.eventStreamsSubscriptions = subscribeDispatchers(rootNode, eventStreams);
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

function makeConstructor() {
  return function customElementConstructor(vtree) {
    this.type = 'Widget';
    this.properties = vtree.properties;
  };
}

function makeInit(tagName, definitionFn) {
  var DOMUser = require('./dom-user');
  return function initCustomElement() {
    var widget = this;
    var element = createContainerElement(tagName, widget.properties);
    var user = new DOMUser(element);
    var eventStreams = definitionFn(user, element.cycleCustomElementProperties);
    subscribeDispatchersWhenRootChanges(user, widget, eventStreams);
    widget.update(null, element);
    return element;
  };
}

function makeUpdate() {
  return function updateCustomElement(prev, elem) {
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
