'use strict';
var Rx = require('rx');
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

function getFunctionForwardIntoStream(stream) {
  return function forwardIntoStream(ev) { stream.onNext(ev); };
}

// traverse the vtree, replacing the value of 'ev-*' fields with
// `function (ev) { view[$PREVIOUS_VALUE].onNext(ev); }`
function replaceStreamNameWithForwardFunction(vtree, view) {
  if (vtree && vtree.type === 'VirtualNode' && typeof vtree.properties !== 'undefined') {
    for (var key in vtree.properties) {
      if (vtree.properties.hasOwnProperty(key) &&
        typeof key === 'string' && key.search(/^ev\-/) === 0)
      {
        var streamName = vtree.properties[key].value;
        if (view[streamName]) {
          vtree.properties[key].value = getFunctionForwardIntoStream(view[streamName]);
        } else {
          throw new Error('VTree uses event hook `' + streamName + '` which should ' +
            'have been defined in `events` array of the View.'
          );
        }
      }
    }
  }
  if (Array.isArray(vtree.children)) {
    for (var i = 0; i < vtree.children.length; i++) {
      replaceStreamNameWithForwardFunction(vtree.children[i], view);
    }
  }
}

function createView() {
  var view = DataFlowNode.apply({}, arguments);
  view = errors.customInterfaceErrorMessageInInject(view,
    'View expects Model to have the required property '
  );
  if (typeof view.events === 'undefined') {
    throw new Error('View must define `events` array with names of event streams');
  }
  if (typeof view.vtree$ === 'undefined') {
    throw new Error('View must define `vtree$` Observable emitting virtual DOM elements');
  }
  if (view.events) {
    for (var i = view.events.length - 1; i >= 0; i--) {
      view[view.events[i]] = new Rx.Subject();
    }
    delete view.events;
  }
  view.vtree$ = view.vtree$
    .map(function (vtree) {
      if (vtree.type !== 'VirtualNode' || vtree.tagName === 'undefined') {
        throw new Error('View `vtree$` must emit only VirtualNode instances. ' +
          'Hint: create them with Cycle.h()'
        );
      }
      replaceStreamNameWithForwardFunction(vtree, view);
      return vtree;
    })
    .multicast(new Rx.BehaviorSubject(null)).refCount()
    .filter(function (x) { return x !== null; })
  ;
  try { view.vtree$.subscribe(function () {}); } catch (err) { }
  var originalArgs = arguments;
  view.clone = function cloneView() {
    return createView.apply({}, originalArgs);
  };
  return view;
}

module.exports = createView;
