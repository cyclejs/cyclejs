'use strict';
let VDOM = {
  h: require('virtual-dom').h,
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
let Rx = require('rx');
let DataFlowNode = require('./data-flow-node');
let CustomElements = require('./custom-elements');

class DOMUser extends DataFlowNode {
  constructor(container) {
    this.type = 'DOMUser';
    // Find and prepare the container
    this._domContainer = (typeof container === 'string') ?
      document.querySelector(container) :
      container;
    // Check pre-conditions
    if (typeof container === 'string' && this._domContainer === null) {
      throw new Error('Cannot render into unknown element \'' + container + '\'');
    } else if (!DOMUser._isElement(this._domContainer)) {
      throw new Error('Given container is not a DOM element neither a selector string.');
    }
    this._defineRootElemStream();
    // Create DataFlowNode with rendering logic
    super(view => {
      this._renderEvery(view.get('vtree$'));
      return {};
    });
  }

  _renderEvery(vtree$) {
    let self = this;
    // Select the correct rootElem
    let rootElem;
    if (self._domContainer.cycleCustomElementProperties) {
      rootElem = self._domContainer;
    } else {
      rootElem = document.createElement('div');
      self._domContainer.innerHTML = '';
      self._domContainer.appendChild(rootElem);
    }
    // TODO Refactor/rework. Unclear why, but this setTimeout is necessary.
    setTimeout(() => self._rawRootElem$.onNext(rootElem), 0);
    // Reactively render the vtree$ into the rootElem
    return vtree$
      .startWith(VDOM.h())
      .map(function renderingPreprocessing(vtree) {
        return self._replaceCustomElements(vtree);
      })
      .pairwise()
      .subscribe(function renderDiffAndPatch([oldVTree, newVTree]) {
        if (typeof newVTree === 'undefined') { return; }

        let arrayOfAll = DOMUser._getArrayOfAllWidgetRootElemStreams(newVTree);
        if (arrayOfAll.length > 0) {
          Rx.Observable.combineLatest(arrayOfAll, () => 0).first()
            .subscribe(function () { self._rawRootElem$.onNext(rootElem); });
        }
        let cycleCustomElementDOMUser = rootElem.cycleCustomElementDOMUser;
        let cycleCustomElementProperties = rootElem.cycleCustomElementProperties;
        try {
          rootElem = VDOM.patch(rootElem, VDOM.diff(oldVTree, newVTree));
        } catch (err) {
          console.error(err);
        }
        if (!!cycleCustomElementDOMUser) {
          rootElem.cycleCustomElementDOMUser = cycleCustomElementDOMUser;
        }
        if (!!cycleCustomElementProperties) {
          rootElem.cycleCustomElementProperties = cycleCustomElementProperties;
        }
        if (arrayOfAll.length === 0) {
          self._rawRootElem$.onNext(rootElem);
        }
      });
  }

  _defineRootElemStream() {
    // Create rootElem stream and automatic className correction
    let originalClasses = (this._domContainer.className || '').trim().split(/\s+/);
    this._rawRootElem$ = new Rx.Subject();
    this._rootElem$ = this._rawRootElem$
      .map(function fixRootElemClassName(rootElem) {
        let previousClasses = rootElem.className.trim().split(/\s+/);
        let missingClasses = originalClasses.filter(function (clss) {
          return previousClasses.indexOf(clss) < 0;
        });
        rootElem.className = previousClasses.concat(missingClasses).join(' ');
        return rootElem;
      })
      .shareReplay(1);
  }

  _replaceCustomElements(vtree) {
    // Silently ignore corner cases
    if (!vtree || !DOMUser._customElements || vtree.type === 'VirtualText') {
      return vtree;
    }
    let tagName = (vtree.tagName || '').toUpperCase();
    // Replace vtree itself
    if (tagName && DOMUser._customElements.hasOwnProperty(tagName)) {
      return new DOMUser._customElements[tagName](vtree);
    }
    // Or replace children recursively
    if (Array.isArray(vtree.children)) {
      for (let i = vtree.children.length - 1; i >= 0; i--) {
        vtree.children[i] = this._replaceCustomElements(vtree.children[i]);
      }
    }
    return vtree;
  }

  event$(selector, eventName) {
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
      let klass = selector.replace('.', '');
      if (rootElem.className.search(new RegExp('\\b' + klass + '\\b')) >= 0) {
        return Rx.Observable.fromEvent(rootElem, eventName);
      }
      let targetElements = rootElem.querySelectorAll(selector);
      if (targetElements && targetElements.length > 0) {
        return Rx.Observable.fromEvent(targetElements, eventName);
      } else {
        return Rx.Observable.empty();
      }
    });
  }

  static _isElement(o) {
    return (
      typeof HTMLElement === 'object' ?
      o instanceof HTMLElement || o instanceof DocumentFragment : //DOM2
      o && typeof o === 'object' && o !== null &&
      (o.nodeType === 1 || o.nodeType === 11) &&
      typeof o.nodeName === 'string'
    );
  }

  static _getArrayOfAllWidgetRootElemStreams(vtree) {
    if (vtree.type === 'Widget' && vtree._rootElem$) {
      return [vtree._rootElem$];
    }
    // Or replace children recursively
    let array = [];
    if (Array.isArray(vtree.children)) {
      for (let i = vtree.children.length - 1; i >= 0; i--) {
        array = array.concat(
          DOMUser._getArrayOfAllWidgetRootElemStreams(vtree.children[i])
        );
      }
    }
    return array;
  }

  static registerCustomElement(tagName, definitionFn) {
    if (typeof tagName !== 'string' || typeof definitionFn !== 'function') {
      throw new Error('registerCustomElement requires parameters `tagName` and ' +
      '`definitionFn`.');
    }
    tagName = tagName.toUpperCase();
    if (DOMUser._customElements && DOMUser._customElements.hasOwnProperty(tagName)) {
      throw new Error('Cannot register custom element `' + tagName + '` ' +
      'for the DOMUser because that tagName is already registered.');
    }

    let WidgetClass = CustomElements.makeConstructor();
    WidgetClass.prototype.init = CustomElements.makeInit(tagName, definitionFn);
    WidgetClass.prototype.update = CustomElements.makeUpdate();
    DOMUser._customElements = DOMUser._customElements || {};
    DOMUser._customElements[tagName] = WidgetClass;
  }
}

module.exports = DOMUser;
