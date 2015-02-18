'use strict';
var VDOM = {
  h: require('virtual-dom').h,
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
var Rx = require('rx');
var DataFlowNode = require('./data-flow-node');
var CustomElements = require('./custom-elements');

function isElement(o) {
  return (
    typeof HTMLElement === 'object' ?
      o instanceof HTMLElement || o instanceof DocumentFragment : //DOM2
      o && typeof o === 'object' && o !== null &&
        (o.nodeType === 1 || o.nodeType === 11) &&
        typeof o.nodeName === 'string'
  );
}

function DOMUser(container) {
  // Find and prepare the container
  this._domContainer = (typeof container === 'string') ?
    document.querySelector(container) :
    container;
  this._originalClasses = this._domContainer.className.trim().split(/\s+/);
  this._rootNode$ = new Rx.ReplaySubject(1);
  // Check pre-conditions
  if (typeof container === 'string' && this._domContainer === null) {
    throw new Error('Cannot render into unknown element \'' + container + '\'');
  } else if (!isElement(this._domContainer)) {
    throw new Error('Given container is not a DOM element neither a selector string.');
  }
  // Create node
  var self = this;
  DataFlowNode.call(this, function injectIntoDOMUser(view) {
    return self._renderEvery(view.get('vtree$'));
  });
}

DOMUser.prototype = Object.create(DataFlowNode.prototype);

DOMUser.prototype._renderEvery = function renderEvery(vtree$) {
  var self = this;
  var rootNode;
  if (self._domContainer.cycleCustomElementProperties) {
    rootNode = self._domContainer;
  } else {
    rootNode = document.createElement('div');
    self._domContainer.innerHTML = '';
    self._domContainer.appendChild(rootNode);
  }
  self._rootNode$.onNext(rootNode);
  return vtree$.startWith(VDOM.h())
    .map(function renderingPreprocessing(vtree) {
      return self._replaceCustomElements(vtree);
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
        self._fixClassName();
        self._rootNode$.onNext(rootNode);
      } catch (err) {
        console.error(err);
      }
    });
};

// TODO Optimize me :)
DOMUser.prototype._fixClassName = function fixClassName() {
  var previousClasses = this._domContainer.className.trim().split(/\s+/);
  var missingClasses = this._originalClasses.filter(function (clss) {
    return previousClasses.indexOf(clss) < 0;
  });
  this._domContainer.className = previousClasses.concat(missingClasses).join(' ');
};

DOMUser.prototype._replaceCustomElements = function replaceCustomElements(vtree) {
  // Silently ignore corner cases
  if (!vtree || !DOMUser._customElements || vtree.type === 'VirtualText') {
    return vtree;
  }
  var tagName = (vtree.tagName || '').toUpperCase();
  // Replace vtree itself
  if (tagName && DOMUser._customElements.hasOwnProperty(tagName)) {
    return new DOMUser._customElements[tagName](vtree);
  }
  // Or replace children recursively
  if (Array.isArray(vtree.children)) {
    for (var i = vtree.children.length - 1; i >= 0; i--) {
      vtree.children[i] = this._replaceCustomElements(vtree.children[i]);
    }
  }
  return vtree;
};

DOMUser.prototype.event$ = function event$(selector, eventName) {
  if (typeof selector !== 'string') {
    throw new Error('DOMUser.event$ expects first argument to be a string as a ' +
      'CSS selector');
  }
  if (typeof eventName !== 'string') {
    throw new Error('DOMUser.event$ expects second argument to be a string ' +
      'representing the event type to listen for.');
  }
  return this._rootNode$
    .filter(function filterEventStream(rootNode) { return !!rootNode; })
    .flatMapLatest(function flatMapEventStream(rootNode) {
      var klass = selector.replace('.', '');
      if (rootNode.className.search(new RegExp('\\b' + klass + '\\b')) >= 0) {
        return Rx.Observable.fromEvent(rootNode, eventName);
      }
      var targetElements = rootNode.querySelectorAll(selector);
      if (targetElements && targetElements.length > 0) {
        return Rx.Observable.fromEvent(targetElements, eventName);
      } else {
        return Rx.Observable.empty();
      }
    });
};

DOMUser.registerCustomElement = function registerCustomElement(tagName, definitionFn) {
  if (typeof tagName !== 'string' || typeof definitionFn !== 'function') {
    throw new Error('registerCustomElement requires parameters `tagName` and ' +
      '`definitionFn`.');
  }
  tagName = tagName.toUpperCase();
  if (DOMUser._customElements && DOMUser._customElements.hasOwnProperty(tagName)) {
    throw new Error('Cannot register custom element `' + tagName + '` ' +
      'for the DOMUser because that tagName is already registered.');
  }
  var WidgetClass = CustomElements.makeConstructor();
  WidgetClass.prototype.init = CustomElements.makeInit(tagName, definitionFn);
  WidgetClass.prototype.update = CustomElements.makeUpdate();
  DOMUser._customElements = DOMUser._customElements || {};
  DOMUser._customElements[tagName] = WidgetClass;
};

module.exports = DOMUser;
