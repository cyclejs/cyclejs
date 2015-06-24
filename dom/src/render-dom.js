'use strict';
let Rx = require('rx');
let VDOM = {
  h: require('virtual-dom').h,
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
let {replaceCustomElementsWithSomething, makeCustomElementsRegistry} =
  require('./custom-elements');

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
      let missingClasses = originalClasses
        .filter(clss => previousClasses.indexOf(clss) < 0);
      //console.log('%cfixRootElemClassName(), missingClasses: ' +
      //  missingClasses, 'color: lightgray');
      rootElem.className = previousClasses.concat(missingClasses).join(' ');
      //console.log('%c  result: ' + rootElem.className, 'color: lightgray');
      //console.log('%cEmit rootElem$ ' + rootElem.tagName + '.' +
      //  rootElem.className, 'color: #009988');
      return rootElem;
    })
    .replay(null, 1);
}

function isVTreeCustomElement(vtree) {
  return (vtree.type === 'Widget' && vtree.isCustomElementWidget);
}

function makeReplaceCustomElementsWithWidgets(CERegistry, driverName) {
  return function replaceCustomElementsWithWidgets(vtree) {
    return replaceCustomElementsWithSomething(vtree, CERegistry,
      (_vtree, WidgetClass) => new WidgetClass(_vtree, CERegistry, driverName)
    );
  };
}

function getArrayOfAllWidgetFirstRootElem$(vtree) {
  if (vtree.type === 'Widget' && vtree.firstRootElem$) {
    return [vtree.firstRootElem$];
  }
  // Or replace children recursively
  let array = [];
  if (Array.isArray(vtree.children)) {
    for (let i = vtree.children.length - 1; i >= 0; i--) {
      array = array.concat(
        getArrayOfAllWidgetFirstRootElem$(vtree.children[i])
      );
    }
  }
  return array;
}

function checkRootVTreeNotCustomElement(vtree) {
  if (isVTreeCustomElement(vtree)) {
    throw new Error('Illegal to use a Cycle custom element as the root of ' +
      'a View.');
  }
}

function makeDiffAndPatchToElement$(rootElem) {
  return function diffAndPatchToElement$([oldVTree, newVTree]) {
    if (typeof newVTree === 'undefined') { return Rx.Observable.empty(); }

    //let isCustomElement = !!rootElem.cycleCustomElementMetadata;
    //let k = isCustomElement ? ' is custom element ' : ' is top level';
    let waitForChildrenStreams = getArrayOfAllWidgetFirstRootElem$(newVTree);
    let rootElemAfterChildrenFirstRootElem$ = Rx.Observable
      .combineLatest(waitForChildrenStreams, () => {
        //console.log('%crawRootElem$ emits. (1)' + k, 'color: #008800');
        return rootElem;
      });
    let cycleCustomElementMetadata = rootElem.cycleCustomElementMetadata;
    //console.log('%cVDOM diff and patch START' + k, 'color: #636300');
    /* eslint-disable */
    rootElem = VDOM.patch(rootElem, VDOM.diff(oldVTree, newVTree));
    /* eslint-enable */
    //console.log('%cVDOM diff and patch END' + k, 'color: #636300');
    if (cycleCustomElementMetadata) {
      rootElem.cycleCustomElementMetadata = cycleCustomElementMetadata;
    }
    if (waitForChildrenStreams.length === 0) {
      //console.log('%crawRootElem$ emits. (2)' + k, 'color: #008800');
      return Rx.Observable.just(rootElem);
    } else {
      //console.log('%crawRootElem$ waiting children.' + k, 'color: #008800');
      return rootElemAfterChildrenFirstRootElem$;
    }
  };
}

function getRenderRootElem(domContainer) {
  let rootElem;
  if (/cycleCustomElement-[^\b]+/.exec(domContainer.className) !== null) {
    rootElem = domContainer;
  } else {
    rootElem = document.createElement('div');
    domContainer.innerHTML = '';
    domContainer.appendChild(rootElem);
  }
  return rootElem;
}

function renderRawRootElem$(vtree$, domContainer, CERegistry, driverName) {
  let rootElem = getRenderRootElem(domContainer);
  let diffAndPatchToElement$ = makeDiffAndPatchToElement$(rootElem);
  return vtree$
    .startWith(VDOM.h())
    .map(makeReplaceCustomElementsWithWidgets(CERegistry, driverName))
    .doOnNext(checkRootVTreeNotCustomElement)
    .pairwise()
    .flatMap(diffAndPatchToElement$);
}

function makeRootElemToEvent$(selector, eventName) {
  return function rootElemToEvent$(rootElem) {
    if (!rootElem) {
      return Rx.Observable.empty();
    }
    //let isCustomElement = !!rootElem.cycleCustomElementMetadata;
    //console.log(`%cget('${selector}', '${eventName}') flatMapper` +
    //  (isCustomElement ? ' for a custom element' : ' for top-level View'),
    //  'color: #0000BB');
    let klass = selector.replace('.', '');
    if (rootElem.className.search(new RegExp(`\\b${klass}\\b`)) >= 0) {
      //console.log('%c  Good return. (A)', 'color:#0000BB');
      //console.log(rootElem);
      return Rx.Observable.fromEvent(rootElem, eventName);
    }
    let targetElements = rootElem.querySelectorAll(selector);
    if (targetElements && targetElements.length > 0) {
      //console.log('%c  Good return. (B)', 'color:#0000BB');
      //console.log(targetElements);
      return Rx.Observable.fromEvent(targetElements, eventName);
    } else {
      //console.log('%c  returning empty!', 'color: #0000BB');
      return Rx.Observable.empty();
    }
  };
}

function makeResponseGetter(rootElem$) {
  return function get(selector, eventName) {
    if (typeof selector !== 'string') {
      throw new Error('DOM driver\'s get() expects first argument to be a ' +
        'string as a CSS selector');
    }
    if (selector.trim() === ':root') {
      return rootElem$;
    }
    if (typeof eventName !== 'string') {
      throw new Error('DOM driver\'s get() expects second argument to be a ' +
        'string representing the event type to listen for.');
    }

    //console.log(`%cget("${selector}", "${eventName}")`, 'color: #0000BB');
    return rootElem$.flatMapLatest(makeRootElemToEvent$(selector, eventName));
  };
}

function validateDOMDriverInput(vtree$) {
  if (!vtree$ || typeof vtree$.subscribe !== 'function') {
    throw new Error('The DOM driver function expects as input an ' +
      'Observable of virtual DOM elements');
  }
}

function makeDOMDriverWithRegistry(container, CERegistry) {
  return function domDriver(vtree$, driverName) {
    validateDOMDriverInput(vtree$);
    let rawRootElem$ = renderRawRootElem$(
      vtree$, container, CERegistry, driverName
    );
    let rootElem$ = fixRootElem$(rawRootElem$, container);
    let disposable = rootElem$.connect();
    return {
      get: makeResponseGetter(rootElem$),
      dispose: disposable.dispose.bind(disposable)
    };
  };
}

function makeDOMDriver(container, customElementDefinitions = {}) {
  // Find and prepare the container
  let domContainer = (typeof container === 'string') ?
    document.querySelector(container) :
    container;
  // Check pre-conditions
  if (typeof container === 'string' && domContainer === null) {
    throw new Error('Cannot render into unknown element \'' + container + '\'');
  } else if (!isElement(domContainer)) {
    throw new Error('Given container is not a DOM element neither a selector ' +
      'string.');
  }

  let registry = makeCustomElementsRegistry(customElementDefinitions);
  return makeDOMDriverWithRegistry(domContainer, registry);
}

module.exports = {
  isElement,
  fixRootElem$,
  isVTreeCustomElement,
  makeReplaceCustomElementsWithWidgets,
  getArrayOfAllWidgetFirstRootElem$,
  checkRootVTreeNotCustomElement,
  makeDiffAndPatchToElement$,
  getRenderRootElem,
  renderRawRootElem$,
  makeResponseGetter,
  validateDOMDriverInput,
  makeDOMDriverWithRegistry,

  makeDOMDriver
};
