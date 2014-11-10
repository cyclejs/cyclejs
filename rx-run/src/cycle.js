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
    for (var i = 0; i < vtree.children.length; i++) {
      replaceStreamNameWithForwardFunction(vtree.children[i], view);
    }
  }
}

function customInterfaceErrorMessageInInject(backwardFn, message) {
  var originalInject = backwardFn.inject;
  backwardFn.inject = function (input) {
    try {
      originalInject(input);
    } catch (err) {
      if (err.name === 'CycleInterfaceError') {
        throw new CycleInterfaceError(message + err.missingMember, err.missingMember);
      } else {
        throw err;
      }
    }
  };
  return backwardFn;
}

function PropertyHook(fn) {
  this.fn = fn;
}
PropertyHook.prototype.hook = function () {
  this.fn.apply(this, arguments);
};

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
    model = customInterfaceErrorMessageInInject(model,
      'Model expects Intent to have the required property '
    );
    model.clone = function () {
      return Cycle.defineModel(intentInterface, definitionFn);
    };
    return model;
  },

  defineView: function (modelInterface, definitionFn) {
    var view = Cycle.defineBackwardFunction(modelInterface, definitionFn);
    view = customInterfaceErrorMessageInInject(view,
      'View expects Model to have the required property '
    );
    if (view.events) {
      for (var i = view.events.length - 1; i >= 0; i--) {
        view[view.events[i]] = new Rx.Subject();
      }
      delete view.events;
    }
    view.vtree$ = view.vtree$.map(function (vtree) {
      // TODO throw error if vtree is not of type vtree or is undefined
      replaceStreamNameWithForwardFunction(vtree, view);
      return vtree;
    });
    view.clone = function () {
      return Cycle.defineView(modelInterface, definitionFn);
    };
    return view;
  },

  defineIntent: function (viewInterface, definitionFn) {
    var intent = Cycle.defineBackwardFunction(viewInterface, definitionFn);
    intent = customInterfaceErrorMessageInInject(intent,
      'Intent expects View to have the required property '
    );
    intent.clone = function () {
      return Cycle.defineIntent(viewInterface, definitionFn);
    };
    return intent;
  },

  link: function (model, view, intent) {
    // TODO generalize this `arguments` array
    if (intent) { intent.inject(view); }
    if (view) { view.inject(model); }
    if (model) { model.inject(intent); }
  },

  vdomPropHook: function (fn) {
    return new PropertyHook(fn);
  },

  // Submodules
  h: h,
  _delegator: new DOMDelegator()
};

module.exports = Cycle;
