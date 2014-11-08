'use strict';
var Rx = require('rx');
var h = require('virtual-hyperscript');
var VDOM = {
  createElement: require('virtual-dom/create-element'),
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
var DOMDelegator = require('dom-delegator');
var BackwardFunction = require('./backward-function');
var errors = require('./errors');
var CycleInterfaceError = errors.CycleInterfaceError;

function noop() {}

function getFunctionForwardIntoStream(stream) {
  return function forwardIntoStream(ev) { stream.onNext(ev); };
}

// traverse the vtree, replacing the value of 'ev-*' fields with
// `function (ev) { view[$PREVIOUS_VALUE].onNext(ev); }`
function replaceStreamNameWithForwardFunction(vtree, view) {
  if (typeof vtree.hooks !== 'undefined') {
    for (var key in vtree.hooks) {
      if (vtree.hooks.hasOwnProperty(key)) {
        var streamName = vtree.hooks[key].value;
        if (view[streamName]) {
          vtree.hooks[key].value = getFunctionForwardIntoStream(view[streamName]);
        } else {
          vtree.hooks[key].value = noop;
        }
      }
    }
  }
  if (Array.isArray(vtree.children)) {
    for (var i = 0; i < vtree.children.length - 1; i++) {
      replaceStreamNameWithForwardFunction(vtree.children[i], view);
    }
  }
}

function customInterfaceErrorMessageInBackwardFeed(backwardFn, message) {
  var originalFeed = backwardFn.feed;
  backwardFn.feed = function (input) {
    try {
      originalFeed(input);
    } catch (err) {
      if (err instanceof CycleInterfaceError) {
        throw new CycleInterfaceError(message + err.missingMember, err.missingMember);
      } else {
        throw err;
      }
    }
  };
  return backwardFn;
}

var Cycle = {
  renderEvery: function (vtree$, containerSelector) {
    // Find and prepare the container
    var container = document.querySelector(containerSelector);
    if (container === null) {
      throw new Error('Couldn\'t render into unknown \'' + containerSelector + '\'');
    }
    container.innerHTML = '';
    // Make the DOM node bound to the VDOM node
    var rootNode = document.createElement('div');
    container.appendChild(rootNode);
    return vtree$.startWith(h())
      .bufferWithCount(2, 1)
      .subscribe(function (buffer) {
        try {
          var oldVTree = buffer[0];
          var newVTree = buffer[1];
          rootNode = VDOM.patch(rootNode, VDOM.diff(oldVTree, newVTree));
        } catch (err) {
          console.error(err);
        }
      });
  },

  defineBackwardFunction: function (inputInterface, definitionFn) {
    return new BackwardFunction(inputInterface, definitionFn);
  },

  defineModel: function (intentInterface, definitionFn) {
    var model = Cycle.defineBackwardFunction(intentInterface, definitionFn);
    model = customInterfaceErrorMessageInBackwardFeed(model,
      'Model expects Intent to have the required property '
    );
    return model;
  },

  defineView: function (modelInterface, definitionFn) {
    var view = Cycle.defineBackwardFunction(modelInterface, definitionFn);
    view = customInterfaceErrorMessageInBackwardFeed(view,
      'View expects Model to have the required property '
    );
    if (view.events) {
      for (var i = view.events.length - 1; i >= 0; i--) {
        view[view.events[i]] = new Rx.Subject();
      }
      delete view.events;
    }
    view.vtree$ = view.vtree$.map(function (vtree) {
      replaceStreamNameWithForwardFunction(vtree, view);
      return vtree;
    });
    return view;
  },

  defineIntent: function (viewInterface, definitionFn) {
    var intent = Cycle.defineBackwardFunction(viewInterface, definitionFn);
    intent = customInterfaceErrorMessageInBackwardFeed(intent,
      'Intent expects View to have the required property '
    );
    return intent;
  },

  link: function (model, view, intent) {
    // TODO generalize this `arguments` array
    if (intent) { intent.feed(view); }
    if (view) { view.feed(model); }
    if (model) { model.feed(intent); }
  },

  // Submodules
  h: h,
  _delegator: new DOMDelegator()
};

module.exports = Cycle;
