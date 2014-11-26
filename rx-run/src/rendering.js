'use strict';

var h = require('virtual-hyperscript');
var VDOM = {
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
var DOMDelegator = require('dom-delegator');
var DataFlowSink = require('./data-flow-sink');

var delegator = new DOMDelegator();

function isElement(o) {
  return (
    typeof HTMLElement === 'object' ?
      o instanceof HTMLElement : //DOM2
      o && typeof o === 'object' && o !== null && o.nodeType === 1 &&
      typeof o.nodeName === 'string'
  );
}

function renderEvery(vtree$, domContainer) {
  domContainer.innerHTML = '';
  // Make the DOM node bound to the VDOM node
  var rootNode = document.createElement('div');
  domContainer.appendChild(rootNode);
  return vtree$.startWith(h())
    .bufferWithCount(2, 1)
    .subscribe(function (buffer) {
      try {
        var oldVTree = buffer[0];
        var newVTree = buffer[1];
        if (typeof newVTree === 'undefined') {
          return;
        }
        rootNode = VDOM.patch(rootNode, VDOM.diff(oldVTree, newVTree));
      } catch (err) {
        console.error(err);
      }
    });
}

function Renderer(container) {
  // Find and prepare the container
  var domContainer = (typeof container === 'string') ?
    document.querySelector(container) :
    container;
  if (typeof container === 'string' && domContainer === null) {
    throw new Error('Cannot render into unknown element \'' + container + '\'');
  } else if (!isElement(domContainer)) {
    throw new Error('Given container is not a DOM element neither a selector string.');
  }
  DataFlowSink.call(this, function injectIntoRenderer(view) {
    return renderEvery(view.vtree$, domContainer);
  });
  this.delegator = delegator;
}

Renderer.prototype = Object.create(DataFlowSink.prototype);

module.exports = {
  Renderer: Renderer,
  renderEvery: renderEvery,
  isElement: isElement,
  delegator: delegator
};
