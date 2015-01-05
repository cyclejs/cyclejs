'use strict';
var Rx = require('rx');
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');
var Utils = require('./utils');

// traverse the vtree, replacing the value of 'ev-*' fields with
// `function (ev) { view[$PREVIOUS_VALUE].onNext(ev); }`
function replaceStreamNameWithStream(vtree, view) {
  if (!vtree) {
    return; // silent ignore
  }
  if (vtree.type === 'VirtualNode' && typeof vtree.properties !== 'undefined') {
    for (var key in vtree.properties) {
      if (vtree.properties.hasOwnProperty(key) &&
        typeof key === 'string' && key.search(/^ev\-/) === 0)
      {
        var streamName = vtree.properties[key].value;
        if (typeof streamName === 'string' && !Utils.endsWithDolarSign(streamName)) {
          throw new Error('VTree event hook should end with dollar sign \$. ' +
            'Name `' + streamName + '` not allowed.');
        }
        if (!view[streamName]) {
          view[streamName] = new Rx.Subject();
        }
        vtree.properties[key].value = view[streamName];
      }
    }
  }
  if (Array.isArray(vtree.children)) {
    for (var i = 0; i < vtree.children.length; i++) {
      replaceStreamNameWithStream(vtree.children[i], view);
    }
  }
}

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
  var newVtree$ = view.get('vtree$')
    .map(function (vtree) {
      if (vtree.type === 'Widget') { return vtree; }
      throwErrorIfNotVTree(vtree);
      replaceStreamNameWithStream(vtree, view);
      return vtree;
    })
    .replay(null, 1);
  newVtree$.connect();
  return newVtree$;
}

function overrideGet(view) {
  var oldGet = view.get;
  var newVtree$ = getCorrectedVtree$(view); // Is here because has connect() side effect
  view.get = function get(streamName) {
    if (streamName === 'vtree$') { // Override get('vtree$')
      return newVtree$;
    } else if (view[streamName]) {
      return view[streamName];
    } else {
      var result = oldGet.call(this, streamName);
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
  var view = new DataFlowNode(definitionFn);
  view = errors.customInterfaceErrorMessageInInject(view,
    'View expects Model to have the required property '
  );
  checkVTree$(view);
  overrideGet(view);
  view.clone = function cloneView() { return createView(definitionFn); };
  return view;
}

module.exports = createView;
