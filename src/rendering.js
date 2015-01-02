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
  if (!vtree || !Cycle._customElements) {
    return vtree;
  }
  // Replace vtree itself
  if (Cycle._customElements.hasOwnProperty(vtree.tagName)) {
    return new Cycle._customElements[vtree.tagName](vtree);
  }
  // Or replace children recursively
  if (Array.isArray(vtree.children)) {
    for (var i = vtree.children.length - 1; i >= 0; i--) {
      vtree.children[i] = replaceCustomElements(vtree.children[i], Cycle);
    }
  }
  return vtree;
}

function getFunctionForwardIntoStream(stream) {
  return function forwardIntoStream(ev) { stream.onNext(ev); };
}

function replaceEventHandlersInVTrees(vtree) {
  if (!vtree) {
    return vtree; // silently ignore
  }
  if (vtree.type === 'VirtualNode') {
    for (var key in vtree.properties) {
      if (vtree.properties.hasOwnProperty(key) &&
        typeof key === 'string' && key.search(/^ev\-/) === 0)
      {
        var stream = vtree.properties[key].value;
        if (stream) {
          vtree.properties[key].value = getFunctionForwardIntoStream(stream);
        }
      }
    }
  }
  if (Array.isArray(vtree.children)) {
    for (var i = 0; i < vtree.children.length; i++) {
      vtree.children[i] = replaceEventHandlersInVTrees(vtree.children[i]);
    }
  }
  return vtree;
}

function renderEvery(vtree$, domContainer, Cycle) {
  var rootNode = document.createElement('div');
  domContainer.innerHTML = '';
  domContainer.appendChild(rootNode);
  return vtree$.startWith(VDOM.h())
    .map(function renderingPreprocessing(vtree) {
      return replaceEventHandlersInVTrees(replaceCustomElements(vtree, Cycle));
    })
    .pairwise()
    .subscribe(function renderDiffAndPatch(pair) {
      try {
        var oldVTree = pair[0];
        var newVTree = pair[1];
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
