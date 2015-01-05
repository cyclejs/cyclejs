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
  if (!vtree || !_customElements) {
    return vtree;
  }
  // Replace vtree itself
  if (_customElements.hasOwnProperty(vtree.tagName)) {
    return new _customElements[vtree.tagName](vtree);
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

function replaceEventHandlersInVTrees(vtree) {
  if (!vtree) {
    return vtree; // silently ignore
  }
  if (vtree.type === 'VirtualNode') {
    for (var key in vtree.properties) {
      if (vtree.properties.hasOwnProperty(key) &&
        typeof key === 'string' && key.search(/^on[a-z]+/) === 0)
      {
        var stream = vtree.properties[key];
        if (stream) {
          vtree.properties[key] = getFunctionForwardIntoStream(stream);
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
  var renderer = this;
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
    return renderEvery(view.get('vtree$'), domContainer, renderer._customElements);
  });
}

Renderer.prototype = Object.create(DataFlowSink.prototype);

/**
 * Informs the Renderer to recognize the given `tagName` as a custom element implemented
 * as `dataFlowNode`, whenever `tagName` is used in VTrees in View given as input to
 * this Renderer. The given `dataFlowNode` must export a `vtree$` Observable. If the
 * `dataFlowNode` expects Observable `foo$` as input, then the custom element's attribute
 * named `foo` will be injected automatically by the Renderer into `foo$`.
 *
 * @param {String} tagName a name for identifying the custom element.
 * @param {DataFlowNode} dataFlowNode the implementation of the custom element.
 * @function registerCustomElement
 */
Renderer.prototype.registerCustomElement = function registerCustomElement(
  tagName, dataFlowNode)
{
  if (typeof tagName !== 'string' || typeof dataFlowNode !== 'object') {
    throw new Error('registerCustomElement requires parameters `tagName` and ' +
      '`dataFlowNode`.');
  }
  if (!dataFlowNode.get('vtree$')) {
    throw new Error('The dataFlowNode for a custom element must export ' +
      '`vtree$`.');
  }
  if (this._customElements && this._customElements.hasOwnProperty(tagName)) {
    throw new Error('Cannot register custom element `' + tagName + '` ' +
      'in Renderer because that tagName is already registered.');
  }
  var WidgetClass = CustomElements.makeConstructor();
  WidgetClass.prototype.init = CustomElements.makeInit(tagName, dataFlowNode);
  WidgetClass.prototype.update = CustomElements.makeUpdate();
  this._customElements = this._customElements || {};
  this._customElements[tagName] = WidgetClass;
  return this;
};

module.exports = Renderer;
