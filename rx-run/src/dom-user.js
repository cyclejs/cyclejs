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

function getArrayOfAllWidgetRootElemStreams(vtree) {
  if (vtree.type === 'Widget' && vtree._rootElem$) {
    return [vtree._rootElem$];
  }
  // Or replace children recursively
  var array = [];
  if (Array.isArray(vtree.children)) {
    for (var i = vtree.children.length - 1; i >= 0; i--) {
      array = array.concat(getArrayOfAllWidgetRootElemStreams(vtree.children[i]));
    }
  }
  return array;
}

function defineRootElemStream(user) {
  // Create rootElem stream and automatic className correction
  var originalClasses = (user._domContainer.className || '').trim().split(/\s+/);
  user._rawRootElem$ = new Rx.Subject();
  user._rootElem$ = user._rawRootElem$
    .map(function fixRootElemClassName(rootElem) {
      var previousClasses = rootElem.className.trim().split(/\s+/);
      var missingClasses = originalClasses.filter(function (clss) {
        return previousClasses.indexOf(clss) < 0;
      });
      rootElem.className = previousClasses.concat(missingClasses).join(' ');
      return rootElem;
    })
    .shareReplay(1);
}

function DOMUser(container) {
  // Find and prepare the container
  this._domContainer = (typeof container === 'string') ?
    document.querySelector(container) :
    container;
  // Check pre-conditions
  if (typeof container === 'string' && this._domContainer === null) {
    throw new Error('Cannot render into unknown element \'' + container + '\'');
  } else if (!isElement(this._domContainer)) {
    throw new Error('Given container is not a DOM element neither a selector string.');
  }
  defineRootElemStream(this);
  // Create DataFlowNode with rendering logic
  var self = this;
  DataFlowNode.call(this, function injectIntoDOMUser(view) {
    return self._renderEvery(view.get('vtree$'));
  });
}

DOMUser.prototype = Object.create(DataFlowNode.prototype);

DOMUser.prototype._renderEvery = function renderEvery(vtree$) {
  var self = this;
  // Select the correct rootElem
  var rootElem;
  if (self._domContainer.cycleCustomElementProperties) {
    rootElem = self._domContainer;
  } else {
    rootElem = document.createElement('div');
    self._domContainer.innerHTML = '';
    self._domContainer.appendChild(rootElem);
  }
  // TODO Refactor/rework. Unclear why, but setTimeout this is necessary.
  setTimeout(function () {
    self._rawRootElem$.onNext(rootElem);
  }, 0);
  // Reactively render the vtree$ into the rootElem
  return vtree$
    .startWith(VDOM.h())
    .map(function renderingPreprocessing(vtree) {
      return self._replaceCustomElements(vtree);
    })
    .pairwise()
    .subscribe(function renderDiffAndPatch(pair) {
      var oldVTree = pair[0];
      var newVTree = pair[1];
      if (typeof newVTree === 'undefined') {
        return;
      }
      var arrayOfAll = getArrayOfAllWidgetRootElemStreams(newVTree);
      if (arrayOfAll.length > 0) {
        Rx.Observable.combineLatest(arrayOfAll, function () { return 0; }).first()
          .subscribe(function () { self._rawRootElem$.onNext(rootElem); });
      }
      var cycleCustomElementProperties = rootElem.cycleCustomElementProperties;
      try {
        rootElem = VDOM.patch(rootElem, VDOM.diff(oldVTree, newVTree));
      } catch (err) {
        console.error(err);
      }
      rootElem.cycleCustomElementProperties = cycleCustomElementProperties;
      if (arrayOfAll.length === 0) {
        self._rawRootElem$.onNext(rootElem);
      }
    });
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
  return this._rootElem$.flatMapLatest(function flatMapDOMUserEventStream(rootElem) {
    if (!rootElem) {
      return Rx.Observable.empty();
    }
    var klass = selector.replace('.', '');
    if (rootElem.className.search(new RegExp('\\b' + klass + '\\b')) >= 0) {
      return Rx.Observable.fromEvent(rootElem, eventName);
    }
    var targetElements = rootElem.querySelectorAll(selector);
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
