'use strict';
var InputProxy = require('./input-proxy');
var Utils = require('./utils');

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
  for (var streamName in eventStreams) {
    if (eventStreams.hasOwnProperty(streamName) &&
      Utils.endsWithDolarSign(streamName) &&
      typeof eventStreams[streamName].subscribe === 'function')
    {
      var eventName = streamName.slice(0, -1);
      eventStreams[streamName].subscribe(makeDispatchFunction(element, eventName));
    }
  }
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
    var element = createContainerElement(tagName, this.properties);
    var user = new DOMUser(element);
    var eventStreams = definitionFn(user, element.cycleCustomElementProperties);
    subscribeDispatchers(element, eventStreams);
    this.update(null, element);
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
      var propStreamName = prop;
      var propName = prop.slice(0, -1);
      if (proxiedProps.hasOwnProperty(propStreamName) &&
        this.properties.hasOwnProperty(propName))
      {
        proxiedProps[propStreamName].onNext(this.properties[propName]);
      }
    }
  };
}

module.exports = {
  makeConstructor: makeConstructor,
  makeInit: makeInit,
  makeUpdate: makeUpdate
};
