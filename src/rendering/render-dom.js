'use strict';
let Rx = require('rx');
let VDOM = {
  h: require('virtual-dom').h,
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
let {replaceCustomElementsWithSomething} = require('./custom-elements');

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
    .replay(null, 1);
}

function isVTreeCustomElement(vtree) {
  return (vtree.type === 'Widget' && vtree.isCustomElementWidget);
}

function replaceCustomElementsWithWidgets(vtree) {
  return replaceCustomElementsWithSomething(vtree,
    (vtree, WidgetClass) => new WidgetClass(vtree)
  );
}

// TODO remove? obsolete? vtree._rootElem$ doesn't exist
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

function checkRootVTreeNotCustomElement(vtree) {
  if (isVTreeCustomElement(vtree)) {
    throw new Error('Illegal to use a Cycle custom element as the root of a View.');
  }
}

function makeDiffAndPatchToElement$(rootElem) {
  return function diffAndPatchToElement$([oldVTree, newVTree]) {
    if (typeof newVTree === 'undefined') { return Rx.Observable.empty(); }

    let arrayOfAll = getArrayOfAllWidgetRootElemStreams(newVTree);
    let rootElemAfterChildren$ = Rx.Observable
      .combineLatest(arrayOfAll, () => {
        //console.log('%cEmit rawRootElem$ (1) ', 'color: #008800');
        return rootElem;
      })
      .first();
    let cycleCustomElementMetadata = rootElem.cycleCustomElementMetadata;
    try {
      //let isCustomElement = !!rootElem.cycleCustomElementMetadata;
      //let k = isCustomElement ? ' is custom element ' : ' is top level';
      //console.log('%cVDOM diff and patch START' + k, 'color: #636300');
      rootElem = VDOM.patch(rootElem, VDOM.diff(oldVTree, newVTree));
      //console.log('%cVDOM diff and patch END' + k, 'color: #636300');
    } catch (err) {
      console.error(err);
    }
    if (!!cycleCustomElementMetadata) {
      rootElem.cycleCustomElementMetadata = cycleCustomElementMetadata;
    }
    if (arrayOfAll.length === 0) {
      //console.log('%cEmit rawRootElem$ (2)', 'color: #008800');
      return Rx.Observable.just(rootElem);
    } else {
      return rootElemAfterChildren$;
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

function renderRawRootElem$(vtree$, domContainer) {
  let rootElem = getRenderRootElem(domContainer);
  let diffAndPatchToElement$ = makeDiffAndPatchToElement$(rootElem);
  return vtree$
    .startWith(VDOM.h())
    .map(replaceCustomElementsWithWidgets)
    .doOnNext(checkRootVTreeNotCustomElement)
    .pairwise()
    .flatMap(diffAndPatchToElement$)
    .startWith(rootElem);
}

function makeInteractions(rootElem$) {
  return {
    get: function get(selector, eventName) {
      if (typeof selector !== 'string') {
        throw new Error('interactions.get() expects first argument to be a ' +
          'string as a CSS selector');
      }
      if (typeof eventName !== 'string') {
        throw new Error('interactions.get() expects second argument to be a ' +
          'string representing the event type to listen for.');
      }

      //console.log(`%cget("${selector}", "${eventName}")`, 'color: #0000BB');
      return rootElem$.flatMapLatest(function flatMapDOMUserEventStream(rootElem) {
        if (!rootElem) {
          return Rx.Observable.empty();
        }
        //let isCustomElement = !!rootElem.cycleCustomElementMetadata;
        //console.log('%cget("' + selector + '", "' + eventName + '") flatMapper' +
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
}

// TODO refactor me
function applyToDOM(container, definitionFn, props = null) {
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
  let proxyVTree$$ = new Rx.AsyncSubject();
  let rawRootElem$ = renderRawRootElem$(proxyVTree$$.mergeAll(), domContainer);
  let rootElem$ = fixRootElem$(rawRootElem$, domContainer);
  let interactions = makeInteractions(rootElem$);
  let definitionOutput = definitionFn(interactions, props);
  let vtree$;
  let customEvents = {};
  if (typeof definitionOutput.subscribe === 'function') {
    vtree$ = definitionOutput;
  } else if (definitionOutput.hasOwnProperty('vtree$') &&
             typeof definitionOutput.vtree$.subscribe === 'function') {
    vtree$ = definitionOutput.vtree$;
    customEvents = definitionOutput;
  } else {
    // TODO test me
    throw new Error('definitionFn given to applyToDOM must return an ' +
      'Observable of virtual DOM elements, or an object containing such ' +
      'Observable named as `vtree$`');
  }
  let subscription = rootElem$.connect();
  proxyVTree$$.onNext(vtree$.shareReplay(1));
  proxyVTree$$.onCompleted();
  return {
    dispose: subscription.dispose.bind(subscription),
    rootElem$,
    interactions,
    customEvents
  };
}

module.exports = {
  isElement,
  fixRootElem$,
  isVTreeCustomElement,
  replaceCustomElementsWithWidgets,
  getArrayOfAllWidgetRootElemStreams,
  checkRootVTreeNotCustomElement,
  makeDiffAndPatchToElement$,
  getRenderRootElem,
  renderRawRootElem$,
  makeInteractions,

  applyToDOM
};
