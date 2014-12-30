'use strict';
var Rx = require('rx');

function makeConstructor() {
  return function customElementConstructor(attributes) {
    this.type = 'Widget';
    this.attributes = {};
    if (!!attributes) {
      for (var prop in attributes) {
        if (attributes.hasOwnProperty(prop)) {
          this.attributes[prop] = attributes[prop];
        }
      }
    }
  };
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

function makeInit(Cycle, tagName, dataFlowNode) {
  return function initCustomElement() {
    var dfn = dataFlowNode.clone();
    var elem = createContainerElement(tagName, dfn);
    var renderer = Cycle.createRenderer(elem);
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
