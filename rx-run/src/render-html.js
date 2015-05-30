'use strict';
let Rx = require('rx');
let toHTML = require('vdom-to-html');
let {replaceCustomElementsWithSomething} = require('./custom-elements');

function makePropertiesProxyFromVTree(vtree) {
  return {
    get(propertyName) {
      return Rx.Observable.just(vtree.properties[propertyName]);
    }
  };
}

/**
 * Converts a tree of VirtualNode|Observable<VirtualNode> into
 * Observable<VirtualNode>.
 */
function transposeVTree(vtree) {
  if (typeof vtree.subscribe === 'function') {
    return vtree;
  } else if (vtree.type === 'VirtualText') {
    return Rx.Observable.just(vtree);
  } else if (vtree.type === 'VirtualNode' && Array.isArray(vtree.children) &&
    vtree.children.length > 0)
  {
    return Rx.Observable
      .combineLatest(vtree.children.map(transposeVTree), (...arr) => {
        vtree.children = arr;
        return vtree;
      });
  } else if (vtree.type === 'VirtualNode') {
    return Rx.Observable.just(vtree);
  } else {
    throw new Error('Unhandled case in transposeVTree()');
  }
}

function makeEmptyInteractions() {
  return {
    get() {
      return Rx.Observable.empty();
    }
  };
}

function replaceCustomElementsWithVTree$(vtree) {
  return replaceCustomElementsWithSomething(vtree,
    function toVTree$(_vtree, WidgetClass) {
      let interactions = makeEmptyInteractions();
      let props = makePropertiesProxyFromVTree(_vtree);
      let output = WidgetClass.definitionFn(interactions, props);
      /*eslint-disable no-use-before-define */
      return convertCustomElementsToVTree(output.vtree$.last());
      /*eslint-enable no-use-before-define */
    });
}

function convertCustomElementsToVTree(vtree$) {
  return vtree$
    .map(replaceCustomElementsWithVTree$)
    .flatMap(transposeVTree);
}

function renderAsHTML(input, customElementDefinitions) {
  let vtree$;
  let computerFn;
  if (typeof input === 'function') {
    computerFn = input;
    vtree$ = computerFn(makeEmptyInteractions());
  } else if (typeof input.subscribe === 'function') {
    vtree$ = input;
  }
  return convertCustomElementsToVTree(vtree$.last())
    .map(vtree => toHTML(vtree));
}

module.exports = {
  makePropertiesProxyFromVTree,
  replaceCustomElementsWithVTree$,
  convertCustomElementsToVTree,

  renderAsHTML
};
