'use strict';
let Rx = require('rx');
let toHTML = require('vdom-to-html');
let {replaceCustomElementsWithSomething} = require('./custom-elements');
let {createStream} = require('../stream');
require('string.prototype.endswith');

function makePropertiesProxyFromVTree(vtree) {
  return {
    get(streamName) {
      if (!streamName.endsWith('$')) {
        throw new Error('Custom element property stream accessed from props.get() must ' +
          'be named ending with $ symbol.');
      }
      let propertyName = streamName.slice(0, -1);
      return Rx.Observable.just(vtree.properties[propertyName]);
    }
  };
}

/**
 * Converts a tree of VirtualNode|Observable<VirtualNode> into Observable<VirtualNode>.
 */
function transposeVTree(vtree) {
  if (typeof vtree.subscribe === 'function') {
    return vtree;
  } else if (vtree.type === 'VirtualText') {
    return Rx.Observable.just(vtree);
  } else if (vtree.type === 'VirtualNode' && Array.isArray(vtree.children) &&
    vtree.children.length > 0)
  {
    /* jshint: -W117 */
    return Rx.Observable.combineLatest(vtree.children.map(transposeVTree), (...arr) => {
      vtree.children = arr;
      return vtree;
    });
    /* jshint: +W117 */
  } else if (vtree.type === 'VirtualNode') {
    return Rx.Observable.just(vtree);
  } else {
    throw new Error('Handle this case please');
  }
}

function replaceCustomElementsWithVTree$(vtree) {
  return replaceCustomElementsWithSomething(vtree, function (vtree, WidgetClass) {
    let vtree$ = createStream(vtree$ => convertCustomElementsToVTree(vtree$.last()));
    let props = makePropertiesProxyFromVTree(vtree);
    WidgetClass.definitionFn(vtree$, props);
    return vtree$;
  });
}

function convertCustomElementsToVTree(vtree$) { // jshint ignore:line
  return vtree$
    .map(replaceCustomElementsWithVTree$)
    .flatMap(transposeVTree);
}

function renderAsHTML(vtree$) {
  return convertCustomElementsToVTree(vtree$.last()).map(vtree => toHTML(vtree));
}

module.exports = {
  makePropertiesProxyFromVTree,
  replaceCustomElementsWithVTree$,
  convertCustomElementsToVTree,

  renderAsHTML
};
