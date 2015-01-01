'use strict';
var Rx = require('rx');

function getEventsOrigDestMap(vtree) {
  var map = {};
  for (var key in vtree.properties) {
    if (vtree.properties.hasOwnProperty(key) &&
      typeof key === 'string' && key.search(/^ev\-/) === 0)
    {
      var originStreamName = key.replace(/^ev\-/, '').concat('$');
      var destinationStream = vtree.properties[key].value;
      map[originStreamName] = destinationStream;
    }
  }
  return map;
}

function createStubsForInterface(interfaceArray) {
  var stubs = {};
  if (!interfaceArray) {
    return stubs;
  }
  for (var i = interfaceArray.length - 1; i >= 0; i--) {
    var streamName = interfaceArray[i];
    stubs[streamName] = new Rx.Subject();
  }
  return stubs;
}

function createContainerElement(tagName, dataFlowNode) {
  var attributesInterface = dataFlowNode.inputInterfaces[0];
  var elem = document.createElement('div');
  elem.className = 'cycleCustomElementContainer-' + tagName;
  elem.cycleCustomElementAttributes = createStubsForInterface(attributesInterface);
  return elem;
}

function endsWithDolarSign(str) {
  if (typeof str !== 'string') {
    return false;
  }
  return str.indexOf('$', str.length - 1) !== -1;
}

function getOriginEventStreams(dataFlowNode) {
  var events = {};
  for (var prop in dataFlowNode) {
    if (dataFlowNode.hasOwnProperty(prop) &&
      endsWithDolarSign(prop) &&
      prop !== 'vtree$')
    {
      events[prop] = dataFlowNode[prop];
    }
  }
  return events;
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

function makeInit(Cycle, tagName, dataFlowNode) {
  return function initCustomElement() {
    var dfn = dataFlowNode.clone();
    var elem = createContainerElement(tagName, dfn);
    var renderer = Cycle.createRenderer(elem);
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
    for (var prop in elem.cycleCustomElementAttributes) {
      var attrStreamName = prop;
      var attrName = prop.slice(0, -1);
      if (elem.cycleCustomElementAttributes.hasOwnProperty(attrStreamName) &&
        this.attributes.hasOwnProperty(attrName))
      {
        elem.cycleCustomElementAttributes[attrStreamName].onNext(
          this.attributes[attrName]
        );
      }
    }
  };
}

function registerCustomElement(tagName, dataFlowNode) {
  if (typeof tagName !== 'string' || typeof dataFlowNode !== 'object') {
    throw new Error('registerCustomElement requires parameters `tagName` and ' +
      '`dataFlowNode`.');
  }
  if (!dataFlowNode.vtree$) {
    throw new Error('The dataFlowNode for a custom element must export ' +
      '`vtree$`.');
  }
  var Cycle = this; // jshint ignore:line
  Cycle._customElements = Cycle._customElements || {};
  Cycle._customElements[tagName] = makeConstructor();
  Cycle._customElements[tagName].prototype.init = makeInit(Cycle, tagName, dataFlowNode);
  Cycle._customElements[tagName].prototype.update = makeUpdate();
}

module.exports = registerCustomElement;
