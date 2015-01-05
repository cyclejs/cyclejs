'use strict';
var InputProxy = require('./input-proxy');
var DataFlowNode = require('./data-flow-node');
var Utils = require('./utils');

function getEventsOrigDestMap(vtree) {
  var map = {};
  for (var key in vtree.properties) {
    if (vtree.properties.hasOwnProperty(key) &&
      typeof key === 'string' && key.search(/^on[a-z]+/) === 0)
    {
      var originStreamName = key.replace(/^on/, '').concat('$');
      var destinationStream = vtree.properties[key];
      map[originStreamName] = destinationStream;
    }
  }
  return map;
}

function createContainerElement(tagName) {
  var elem = document.createElement('div');
  elem.className = 'cycleCustomElementContainer-' + tagName;
  elem.cycleCustomElementAttributes = new InputProxy();
  return elem;
}

function getOriginEventStreams(dataFlowNode) {
  if (!(dataFlowNode instanceof DataFlowNode) ||
    !Array.isArray(dataFlowNode.outputStreams))
  {
    return {};
  }
  return dataFlowNode.outputStreams
    .filter(function (streamName) {
      return Utils.endsWithDolarSign(streamName) && streamName !== 'vtree$';
    })
    .reduce(function (events, streamName) {
      events[streamName] = dataFlowNode.get(streamName);
      return events;
    }, {});
}

function subscribeAndForward(origin$, destination$) {
  origin$.subscribe(
    function onNextWidgetEvent(x) { destination$.onNext(x); },
    function onErrorWidgetEvent(e) { destination$.onError(e); },
    function onCompletedWidgetEvent() { destination$.onCompleted(); }
  );
}

function forwardOriginEventsToDestinations(events, origDestMap) {
  for (var originStreamName in events) {
    if (events.hasOwnProperty(originStreamName) &&
      origDestMap.hasOwnProperty(originStreamName))
    {
      subscribeAndForward(events[originStreamName], origDestMap[originStreamName]);
    }
  }
}

function makeConstructor() {
  return function customElementConstructor(vtree) {
    this.type = 'Widget';
    this.attributes = vtree.properties.attributes;
    this.eventsOrigDestMap = getEventsOrigDestMap(vtree);
  };
}

function makeInit(tagName, dataFlowNode) {
  var Renderer = require('./renderer');
  return function initCustomElement() {
    var dfn = dataFlowNode.clone();
    var elem = createContainerElement(tagName);
    var renderer = new Renderer(elem);
    var events = getOriginEventStreams(dfn);
    forwardOriginEventsToDestinations(events, this.eventsOrigDestMap);
    renderer.inject(dfn);
    dfn.inject(elem.cycleCustomElementAttributes);
    this.update(null, elem);
    return elem;
  };
}

function makeUpdate() {
  return function updateCustomElement(prev, elem) {
    if (!elem ||
      !elem.cycleCustomElementAttributes ||
      !(elem.cycleCustomElementAttributes instanceof InputProxy) ||
      !elem.cycleCustomElementAttributes.proxiedProps)
    {
      return;
    }
    var proxiedProps = elem.cycleCustomElementAttributes.proxiedProps;
    for (var prop in proxiedProps) {
      var attrStreamName = prop;
      var attrName = prop.slice(0, -1);
      if (proxiedProps.hasOwnProperty(attrStreamName) &&
        this.attributes.hasOwnProperty(attrName))
      {
        proxiedProps[attrStreamName].onNext(this.attributes[attrName]);
      }
    }
  };
}

module.exports = {
  makeConstructor: makeConstructor,
  makeInit: makeInit,
  makeUpdate: makeUpdate
};
