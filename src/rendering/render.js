'use strict';
let Rx = require('rx');
let VDOM = {
  h: require('virtual-dom').h,
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch'),
  createElement: require('virtual-dom/create-element')
};
let {replaceCustomElementsWithSomething} = require('./custom-element-replacer');

function isElement(obj) {
  return (
    typeof HTMLElement === 'object' ?
    obj instanceof HTMLElement || obj instanceof DocumentFragment : //DOM2
    obj && typeof obj === 'object' && obj !== null &&
    (obj.nodeType === 1 || obj.nodeType === 11) &&
    typeof obj.nodeName === 'string'
  );
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

function makeDiffAndPatchToElement(rootElem, oldVTree, newVTree) {
  try {
    return VDOM.patch(rootElem, VDOM.diff(oldVTree, newVTree));
  } catch (err) {
    // console.error(err);
    // actually, rethrow
    throw err;
  }
}

function isVTreeCustomElement(vtree) {
  return vtree.type === 'Widget';
}

function renderRawRootElem(vtree$, domContainer, customElementsRegistry) {
  let startNode = VDOM.h();
  let vtreePair$ = vtree$.startWith(startNode);

  if (customElementsRegistry) {
    // actually doOnNext because this only modifies source VNode
    vtreePair$ = vtreePair$.map(function replaceCustomElements(vtree) {
      if (vtree === startNode) {
        return vtree;
      }
      return replaceCustomElementsWithSomething(
        vtree,
        customElementsRegistry,
        function createCustomElement(vtree, WidgetClass) {
          return new WidgetClass(vtree);
        }
      );
    });
  }

  vtreePair$ = vtreePair$
    .doOnNext(function checkRootVTreeNotCustomElement(vtree) {
      // flatMap combined observable.throw might be better
      if (isVTreeCustomElement(vtree)) {
        throw new Error('Illegal to use a Cycle custom element as the root of a View.');
      }
    })
    .pairwise();

  return Rx.Observable.defer(function createRootElement() {
    let renderRootElem = getRenderRootElem(domContainer);
    let startElem = VDOM.createElement(startNode);
    renderRootElem.appendChild(startElem);

    return Rx.Observable.just(startElem);
  }).merge(vtreePair$)
    .scan(function makePatch(rootElem, vtreePair) {
      return makeDiffAndPatchToElement(rootElem, vtreePair[0], vtreePair[1]);
    })
    .skip(1)
    .replay(null, 1);
}

function makeInteraction(rootElem$) {
  return {
    choose(selector, eventName) {
      return rootElem$.flatMapLatest(function rootElemFromEvent(rootElem) {
        let className = selector.replace('.', '');
        let pattern = new RegExp('\\b' + className + '\\b');
        if (pattern.test(rootElem.className)) {
          //console.log('%c  Good return. (A)', 'color:#0000BB');
          return Rx.Observable.fromEvent(rootElem, eventName);
        }
        let targetElements = rootElem.querySelectorAll(selector);
        if (targetElements && targetElements.length > 0) {
          //console.log('%c  Good return. (B)', 'color:#0000BB');
          return Rx.Observable.fromEvent(targetElements, eventName);
        }
        return Rx.Observable.empty();
      });
    }
  };
}

function render(vtree$, container, customElementsRegistry) {
  let domContainer = (typeof container === 'string') ?
    document.querySelector(container) :
    container;
  // Check pre-conditions
  if (typeof container === 'string' && domContainer === null) {
    throw new Error('Cannot render into unknown element \'' + container + '\'');
  } else if (!isElement(domContainer)) {
    throw new Error('Given container is not a DOM element neither a selector string.');
  }
  let rootElem$ = renderRawRootElem(vtree$, domContainer, customElementsRegistry);
  let interactions = makeInteraction(rootElem$);
  return {
    rootElem$,
    interactions,
    choose: interactions.choose,
    connect: function connectRootElem(onError) {
      let sub = onError ? rootElem$.subscribeOnError(onError) : rootElem$.subscribe();
      return new Rx.CompositeDisposable(sub, rootElem$.connect());
    }
  };
}

module.exports = {
  makeInteraction,
  render
};
