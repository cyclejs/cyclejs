'use strict';
var Rx = require('rx');
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

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
        if (view[streamName]) {
          vtree.properties[key].value = view[streamName];
        } else if (typeof streamName === 'string') {
          throw new Error('VTree uses event hook `' + streamName + '` which should ' +
            'have been defined in `events` array of the View.'
          );
        }
      }
    }
  }
  if (Array.isArray(vtree.children)) {
    for (var i = 0; i < vtree.children.length; i++) {
      replaceStreamNameWithStream(vtree.children[i], view);
    }
  }
}

function checkEventsArray(view) {
  if (view.get('events') === null) {
    throw new Error('View must define `events` array with names of event streams');
  }
}

function createEventStreamsInto(view) {
  if (view.get('events')) {
    for (var i = view.get('events').length - 1; i >= 0; i--) {
      view[view.get('events')[i]] = new Rx.Subject();
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
    .replay();
  newVtree$.connect();
  return newVtree$;
}

function overrideGet(view) {
  var oldGet = view.get;
  var newVtree$ = getCorrectedVtree$(view); // Is here because has connect() side effect
  var eventsArray = view.get('events');
  eventsArray = (Array.isArray(eventsArray)) ? eventsArray : null;
  view.get = function get(streamName) {
    var eventsArrayHasStreamName = eventsArray && eventsArray.indexOf(streamName) !== -1;
    if (streamName === 'vtree$') { // Override get('vtree$')
      return newVtree$;
    } else if (eventsArrayHasStreamName && view.hasOwnProperty(streamName)) {
      return view[streamName];
    } else {
      return oldGet.call(this, streamName);
    }
  };
}

function createView(definitionFn) {
  var view = new DataFlowNode(definitionFn);
  view = errors.customInterfaceErrorMessageInInject(view,
    'View expects Model to have the required property '
  );
  checkEventsArray(view);
  checkVTree$(view);
  createEventStreamsInto(view);
  overrideGet(view);
  view.clone = function cloneView() { return createView(definitionFn); };
  return view;
}

module.exports = createView;
