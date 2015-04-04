'use strict';
let VDOM = {
  h: require('virtual-dom').h,
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
let Rx = require('rx');
let CustomElements = require('./custom-elements');
let CustomElementsRegistry = {}; // TODO replace with ES6 Map

function isElement(obj) {
  return (
    typeof HTMLElement === 'object' ?
    obj instanceof HTMLElement || obj instanceof DocumentFragment : //DOM2
    obj && typeof obj === 'object' && obj !== null &&
    (obj.nodeType === 1 || obj.nodeType === 11) &&
    typeof obj.nodeName === 'string'
  );
}

function fixRootElem$(rawRootElem$, domContainer) {
  // Create rootElem stream and automatic className correction
  let originalClasses = (domContainer.className || '').trim().split(/\s+/);
  //console.log('%coriginalClasses: ' + originalClasses, 'color: lightgray');
  return rawRootElem$
    .map(function fixRootElemClassName(rootElem) {
      let previousClasses = rootElem.className.trim().split(/\s+/);
      let missingClasses = originalClasses.filter(function (clss) {
        return previousClasses.indexOf(clss) < 0;
      });
      //console.log('%cfixRootElemClassName(), missingClasses: ' + missingClasses,
      //  'color: lightgray');
      rootElem.className = previousClasses.concat(missingClasses).join(' ');
      //console.log('%c  result: ' + rootElem.className, 'color: lightgray');
      //console.log('%cEmit rootElem$ ' + rootElem.tagName + '.' + rootElem.className,
      //  'color: #009988');
      return rootElem;
    })
    .shareReplay(1);
}

function isVtreeCustomElement(vtree) {
  return (vtree.type === 'Widget' && !!vtree._rootElem$);
}

function replaceCustomElements(vtree) {
  // Silently ignore corner cases
  if (!vtree || vtree.type === 'VirtualText') {
    return vtree;
  }
  let tagName = (vtree.tagName || '').toUpperCase();
  // Replace vtree itself
  if (tagName && CustomElementsRegistry.hasOwnProperty(tagName)) {
    return new CustomElementsRegistry[tagName](vtree);
  }
  // Or replace children recursively
  if (Array.isArray(vtree.children)) {
    for (let i = vtree.children.length - 1; i >= 0; i--) {
      vtree.children[i] = replaceCustomElements(vtree.children[i]);
    }
  }
  return vtree;
}

function getArrayOfAllWidgetRootElemStreams(vtree) {
  if (vtree.type === 'Widget' && vtree._rootElem$) {
    return [vtree._rootElem$];
  }
  // Or replace children recursively
  let array = [];
  if (Array.isArray(vtree.children)) {
    for (let i = vtree.children.length - 1; i >= 0; i--) {
      array = array.concat(
        getArrayOfAllWidgetRootElemStreams(vtree.children[i])
      );
    }
  }
  return array;
}

function renderRawRootElem$(vtree$, domContainer) {
  // Select the correct rootElem
  let rootElem;
  if (/cycleCustomElement-[^\b]+/.exec(domContainer.className) !== null) {
    rootElem = domContainer;
  } else {
    rootElem = document.createElement('div');
    domContainer.innerHTML = '';
    domContainer.appendChild(rootElem);
  }
  // TODO Refactor/rework. Unclear why, but this setTimeout is necessary.
  //setTimeout(() => rawRootElem$.onNext(rootElem), 0);
  // Make rootElem$ from vtree$
  return vtree$
    .startWith(VDOM.h())
    .map(function renderingPreprocessing(vtree) {
      return replaceCustomElements(vtree);
    })
    .map(function checkDOMUserVtreeNotCustomElement(vtree) {
      if (isVtreeCustomElement(vtree)) {
        throw new Error('Illegal to use a Cycle custom element as the root of a View.');
      }
      return vtree;
    })
    .pairwise()
    .flatMap(function renderDiffAndPatch([oldVTree, newVTree]) {
      if (typeof newVTree === 'undefined') { return; }

      let arrayOfAll = getArrayOfAllWidgetRootElemStreams(newVTree);
      let rootElemAfterChildren$ = Rx.Observable.combineLatest(arrayOfAll, () => {
        //console.log('%cEmit rawRootElem$ (1) ', 'color: #008800');
        return rootElem;
      })
        .first();
      let cycleCustomElementDOMUser = rootElem.cycleCustomElementDOMUser;
      let cycleCustomElementProperties = rootElem.cycleCustomElementProperties;
      try {
        //console.log('%cVDOM diff and patch START', 'color: #636300');
        rootElem = VDOM.patch(rootElem, VDOM.diff(oldVTree, newVTree));
        //console.log('%cVDOM diff and patch END', 'color: #636300');
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
        //console.log('%cEmit rawRootElem$ (2)', 'color: #008800');
        return Rx.Observable.just(rootElem);
      } else {
        return rootElemAfterChildren$;
      }
    })
    .startWith(rootElem);
}

function makeGetInteractions$Fn(rootElem$) {
  return function getInteractions() {
    return {
      subscribe: function subscribe() {
        throw new Error('Cannot subscribe to interactions$ without first calling ' +
          'choose(selector, eventName)'
        );
      },
      choose: function choose(selector, eventName) {
        if (typeof selector !== 'string') {
          throw new Error('interactions$.choose() expects first argument to be a ' +
          'string as a CSS selector');
        }
        if (typeof eventName !== 'string') {
          throw new Error('interactions$.choose() expects second argument to be a ' +
          'string representing the event type to listen for.');
        }

        //console.log(`%cchoose("${selector}", "${eventName}")`, 'color: #0000BB');
        return rootElem$.flatMapLatest(function flatMapDOMUserEventStream(rootElem) {
          if (!rootElem) {
            return Rx.Observable.empty();
          }
          //let isCustomElement = !!rootElem.cycleCustomElementDOMUser;
          //console.log('%cchoose("' + selector + '", "' + eventName + '") flatMapper' +
          //  (isCustomElement ? ' for a custom element' : ' for top-level View'),
          //  'color: #0000BB');
          let klass = selector.replace('.', '');
          if (rootElem.className.search(new RegExp('\\b' + klass + '\\b')) >= 0) {
            //console.log('%c  Good return. (A)', 'color:#0000BB');
            return Rx.Observable.fromEvent(rootElem, eventName);
          }
          let targetElements = rootElem.querySelectorAll(selector);
          if (targetElements && targetElements.length > 0) {
            //console.log('%c  Good return. (B)', 'color:#0000BB');
            return Rx.Observable.fromEvent(targetElements, eventName);
          } else {
            //console.log('%c  returning empty!', 'color: #0000BB');
            return Rx.Observable.empty();
          }
        });
      }
    };
  };
}

function render(vtree$, container) {
  // Find and prepare the container
  let domContainer = (typeof container === 'string') ?
    document.querySelector(container) :
    container;
  // Check pre-conditions
  if (typeof container === 'string' && domContainer === null) {
    throw new Error('Cannot render into unknown element \'' + container + '\'');
  } else if (!isElement(domContainer)) {
    throw new Error('Given container is not a DOM element neither a selector string.');
  }
  let rawRootElem$ = renderRawRootElem$(vtree$, domContainer);
  let rootElem$ = fixRootElem$(rawRootElem$, domContainer);
  rootElem$.getInteractions$ = makeGetInteractions$Fn(rootElem$);
  rootElem$.publish().connect();
  return rootElem$;
}

function registerCustomElement(tagName, definitionFn) {
  if (typeof tagName !== 'string' || typeof definitionFn !== 'function') {
    throw new Error('registerCustomElement requires parameters `tagName` and ' +
    '`definitionFn`.');
  }
  tagName = tagName.toUpperCase();
  if (CustomElementsRegistry.hasOwnProperty(tagName)) {
    throw new Error('Cannot register custom element `' + tagName + '` ' +
    'for the DOMUser because that tagName is already registered.');
  }

  let WidgetClass = CustomElements.makeConstructor();
  WidgetClass.prototype.init = CustomElements.makeInit(tagName, definitionFn);
  WidgetClass.prototype.update = CustomElements.makeUpdate();
  CustomElementsRegistry[tagName] = WidgetClass;
}

module.exports = {
  render: render,
  registerCustomElement: registerCustomElement
};
