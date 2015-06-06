'use strict';
let Rx = require('rx');
let toHTML = require('vdom-to-html');
let {replaceCustomElementsWithSomething, makeCustomElementsRegistry} =
  require('./custom-elements');
let {makeCustomElementInput} = require('./custom-element-widget');

function makePropertiesDriverFromVTree(vtree) {
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

function makeReplaceCustomElementsWithVTree$(CERegistry, driverName) {
  return function replaceCustomElementsWithVTree$(vtree) {
    return replaceCustomElementsWithSomething(vtree, CERegistry,
      function toVTree$(_vtree, WidgetClass) {
        let interactions = {get: () => Rx.Observable.empty()};
        let props = makePropertiesDriverFromVTree(_vtree);
        let input = makeCustomElementInput(interactions, props);
        let output = WidgetClass.definitionFn(input);
        let vtree$ = output[driverName].last();
        /*eslint-disable no-use-before-define */
        return convertCustomElementsToVTree(vtree$, CERegistry, driverName);
        /*eslint-enable no-use-before-define */
      });
  };
}

function convertCustomElementsToVTree(vtree$, CERegistry, driverName) {
  return vtree$
    .map(makeReplaceCustomElementsWithVTree$(CERegistry, driverName))
    .flatMap(transposeVTree);
}

function makeHTMLDriver(customElementDefinitions = {}) {
  let registry = makeCustomElementsRegistry(customElementDefinitions);
  return function htmlDriver(vtree$, driverName) {
    let vtreeLast$ = vtree$.last();
    return {
      get(...params) {
        if (params.length === 0) {
          return convertCustomElementsToVTree(vtreeLast$, registry, driverName)
            .map(vtree => toHTML(vtree));
        } else {
          return Rx.Observable.empty();
        }
      }
    };
  };
}

module.exports = {
  makePropertiesDriverFromVTree,
  makeReplaceCustomElementsWithVTree$,
  convertCustomElementsToVTree,

  makeHTMLDriver
};
