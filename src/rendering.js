'use strict';
var VDOM = {
  h: require('virtual-dom').h,
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

function replaceCustomElements(vtree, Cycle) {
  // Silently ignore corner cases
  if (!vtree || !Cycle._customElements || !Array.isArray(vtree.children)) {
    return;
  }
  // Replace vtree itself
  if (Cycle._customElements.hasOwnProperty(vtree.tagName)) {
    return new Cycle._customElements[vtree.tagName](vtree.properties.attributes);
  }
  // Or replace children recursively
  for (var i = vtree.children.length - 1; i >= 0; i--) {
    var tagName = vtree.children[i].tagName;
    if (Cycle._customElements.hasOwnProperty(tagName)) {
      vtree.children[i] = new Cycle._customElements[tagName](
        vtree.children[i].properties.attributes
      );
    } else {
      replaceCustomElements(vtree.children[i], Cycle);
    }
  }
  return vtree;
}

function renderEvery(vtree$, domContainer, Cycle) {
  var rootNode = document.createElement('div');
  domContainer.innerHTML = '';
  domContainer.appendChild(rootNode);
  return vtree$.startWith(VDOM.h())
    .map(function replaceCustomElementsBeforeRendering(vtree) {
      return replaceCustomElements(vtree, Cycle);
    })
    .bufferWithCount(2, 1)
    .subscribe(function renderDiffAndPatch(buffer) {
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

function Renderer(container, Cycle) {
  // Find and prepare the container
  var domContainer = (typeof container === 'string') ?
    document.querySelector(container) :
    container;
  // Check pre-conditions
  if (typeof container === 'string' && domContainer === null) {
    throw new Error('Cannot render into unknown element \'' + container + '\'');
  } else if (!isElement(domContainer)) {
    throw new Error('Given container is not a DOM element neither a selector string.');
  }
  // Create sink
  DataFlowSink.call(this, function injectIntoRenderer(view) {
    return renderEvery(view.vtree$, domContainer, Cycle);
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
