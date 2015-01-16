'use strict';
var VDOM = {
  h: require('virtual-dom').h,
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
var DataFlowSink = require('./data-flow-sink');
var CustomElements = require('./custom-elements');

function isElement(o) {
  return (
    typeof HTMLElement === 'object' ?
      o instanceof HTMLElement : //DOM2
      o && typeof o === 'object' && o !== null && o.nodeType === 1 &&
      typeof o.nodeName === 'string'
  );
}

function replaceCustomElements(vtree, _customElements) {
  // Silently ignore corner cases
  if (!vtree || !_customElements || vtree.type === 'VirtualText') {
    return vtree;
  }
  // Replace vtree itself
  if (vtree.tagName && _customElements.hasOwnProperty(vtree.tagName.toUpperCase())) {
    return new _customElements[vtree.tagName.toUpperCase()](vtree);
  }
  // Or replace children recursively
  if (Array.isArray(vtree.children)) {
    for (var i = vtree.children.length - 1; i >= 0; i--) {
      vtree.children[i] = replaceCustomElements(vtree.children[i], _customElements);
    }
  }
  return vtree;
}

function getFunctionForwardIntoStream(stream) {
  return function forwardIntoStream(ev) { stream.onNext(ev); };
}

/**
 * Mutates vtree.properties[eventName] replacing its (expected) stream with a
 * handler function that forwards the event into the stream using onNext().
 * @param  {VirtualNode} vtree
 * @param  {String} eventName
 */
function replaceEventHandler(vtree, eventName) {
  if (typeof eventName !== 'string' && eventName.search(/^on[a-z]+/) !== 0) {
    return;
  }
  var stream = vtree.properties[eventName];
  if (!stream || typeof stream === 'function' || !stream.subscribe) {
    return;
  }
  vtree.properties[eventName] = getFunctionForwardIntoStream(stream);
}

function replaceEventHandlersInVTrees(vtree) {
  if (!vtree) {
    return vtree; // silently ignore
  }
  if (vtree.type === 'VirtualNode' && !!vtree.properties) {
    for (var key in vtree.properties) {
      if (vtree.properties.hasOwnProperty(key)) {
        replaceEventHandler(vtree, key);
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

function renderEvery(vtree$, domContainer, _customElements) {
  var rootNode = document.createElement('div');
  domContainer.innerHTML = '';
  domContainer.appendChild(rootNode);
  return vtree$.startWith(VDOM.h())
    .map(function renderingPreprocessing(vtree) {
      return replaceEventHandlersInVTrees(replaceCustomElements(vtree, _customElements));
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

function Renderer(container) {
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
    return renderEvery(view.get('vtree$'), domContainer, Renderer._customElements);
  });
}

Renderer.prototype = Object.create(DataFlowSink.prototype);

Renderer.registerCustomElement = function registerCustomElement(tagName, dataFlowNode) {
  if (typeof tagName !== 'string' || typeof dataFlowNode !== 'object') {
    throw new Error('registerCustomElement requires parameters `tagName` and ' +
      '`dataFlowNode`.');
  }
  if (!dataFlowNode.get('vtree$')) {
    throw new Error('The dataFlowNode for a custom element must export ' +
      '`vtree$`.');
  }
  tagName = tagName.toUpperCase();
  if (Renderer._customElements && Renderer._customElements.hasOwnProperty(tagName)) {
    throw new Error('Cannot register custom element `' + tagName + '` ' +
      'in Renderer because that tagName is already registered.');
  }
  var WidgetClass = CustomElements.makeConstructor();
  WidgetClass.prototype.init = CustomElements.makeInit(tagName, dataFlowNode);
  WidgetClass.prototype.update = CustomElements.makeUpdate();
  Renderer._customElements = Renderer._customElements || {};
  Renderer._customElements[tagName] = WidgetClass;
};

module.exports = Renderer;
