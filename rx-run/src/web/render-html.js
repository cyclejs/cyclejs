'use strict';
let Rx = require('rx');
let toHTML = require('vdom-to-html');
let {replaceCustomElementsWithSomething, makeCustomElementsRegistry} =
  require('./custom-elements');
let {makeCustomElementInput} = require('./custom-element-widget');

function makePropertiesAdapterFromVTree(vtree) {
  return {
    get: (propertyName) => Rx.Observable.just(vtree.properties[propertyName])
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

function makeReplaceCustomElementsWithVTree$(CERegistry, adapterName) {
  return function replaceCustomElementsWithVTree$(vtree) {
    return replaceCustomElementsWithSomething(vtree, CERegistry,
      function toVTree$(_vtree, WidgetClass) {
        let interactions = {get: () => Rx.Observable.empty()};
        let props = makePropertiesAdapterFromVTree(_vtree);
        let input = makeCustomElementInput(interactions, props);
        let output = WidgetClass.definitionFn(input);
        let vtree$ = output[adapterName].last();
        /*eslint-disable no-use-before-define */
        return convertCustomElementsToVTree(vtree$, CERegistry, adapterName);
        /*eslint-enable no-use-before-define */
      });
  };
}

function convertCustomElementsToVTree(vtree$, CERegistry, adapterName) {
  return vtree$
    .map(makeReplaceCustomElementsWithVTree$(CERegistry, adapterName))
    .flatMap(transposeVTree);
}

function makeHTMLAdapter(customElementDefinitions = {}) {
  let registry = makeCustomElementsRegistry(customElementDefinitions);
  return function htmlAdapter(vtree$, adapterName) {
    let vtreeLast$ = vtree$.last();
    return {
      get(...params) {
        if (params.length === 0) {
          return convertCustomElementsToVTree(vtreeLast$, registry, adapterName)
            .map(vtree => toHTML(vtree));
        } else {
          return Rx.Observable.empty();
        }
      }
    };
  };
}

module.exports = {
  makePropertiesAdapterFromVTree,
  makeReplaceCustomElementsWithVTree$,
  convertCustomElementsToVTree,

  makeHTMLAdapter
};
