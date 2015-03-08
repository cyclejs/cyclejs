'use strict';
let Rx = require('rx');
let DataFlowNode = require('./data-flow-node');
let errors = require('./errors');

function checkVTree$(view) {
  if (view.get('vtree$') === null ||
    typeof view.get('vtree$').subscribe !== 'function')
  {
    throw new Error('View must define `vtree$` Observable emitting virtual DOM elements');
  }
}

function throwErrorIfNotVTree(vtree) {
  if (vtree.type !== 'VirtualNode' || vtree.tagName === 'undefined') {
    throw new Error('View `vtree$` must emit only VirtualNode instances. ' +
      'Hint: create them with Cycle.h()'
    );
  }
}

function getCorrectedVtree$(view) {
  let newVtree$ = view.get('vtree$')
    .map(function (vtree) {
      if (vtree.type === 'Widget') { return vtree; }
      throwErrorIfNotVTree(vtree);
      return vtree;
    })
    .replay(null, 1);
  newVtree$.connect();
  return newVtree$;
}

function overrideGet(view) {
  let oldGet = view.get;
  let newVtree$ = getCorrectedVtree$(view); // Is here because has connect() side effect
  view.get = function get(streamName) {
    if (streamName === 'vtree$') { // Override get('vtree$')
      return newVtree$;
    } else if (view[streamName]) {
      return view[streamName];
    } else {
      let result = oldGet.call(this, streamName);
      if (!result) {
        view[streamName] = new Rx.Subject();
        return view[streamName];
      } else {
        return result;
      }
    }
  };
}

function createView(definitionFn) {
  let view = new DataFlowNode(definitionFn);
  view = errors.customInterfaceErrorMessageInInject(view,
    'View expects Model to have the required property '
  );
  checkVTree$(view);
  overrideGet(view);
  view.clone = function cloneView() { return createView(definitionFn); };
  return view;
}

module.exports = createView;
