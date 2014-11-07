'use strict';
var Rx = require('rx');
var h = require('virtual-hyperscript');
var VDOM = {
  createElement: require('virtual-dom/create-element'),
  diff: require('virtual-dom/diff'),
  patch: require('virtual-dom/patch')
};
var DOMDelegator = require('dom-delegator');

function replicate(source, subject) {
  if (typeof source === 'undefined') {
    throw new Error('Cannot replicate() if source is undefined.');
  }
  return source.subscribe(
    function replicationOnNext(x) {
      subject.onNext(x);
    },
    function replicationOnError(err) {
      console.error(err);
    }
  );
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
    vtree$.startWith(h())
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
    return true;
  },

  defineModel: function (intentType, definitionFn) {
    var intentStub = {};
    for (var i = intentType.length - 1; i >= 0; i--) {
      intentStub[intentType[i]] = new Rx.Subject();
    }
    var model = definitionFn(intentStub);
    model.observe = function (intent) {
      for (var key in intentStub) {
        if (intentStub.hasOwnProperty(key)) {
          if (!intent.hasOwnProperty(key)) {
            throw new Error('Intent should have the required property ' + key);
          }
          replicate(intent[key], intentStub[key]);
        }
      }
    };
    return model;
  },

  defineView: function (modelType, definitionFn) {
    var i;
    var modelStub = {};
    for (i = modelType.length - 1; i >= 0; i--) {
      modelStub[modelType[i]] = new Rx.Subject();
    }
    var view = definitionFn(modelStub);
    view.observe = function (model) {
      for (var key in modelStub) {
        if (modelStub.hasOwnProperty(key)) {
          if (!model.hasOwnProperty(key)) {
            throw new TypeError('Model should have the required property ' + key);
          }
          replicate(model[key], modelStub[key]);
        }
      }
    };
    for (i = view.events.length - 1; i >= 0; i--) {
      view[view.events[i]] = new Rx.Subject();
    }
    delete view.events;
    view.vtree$ = view.vtree$.map(function (vtree) {
      // replace stream name with event replicator
      for (var key in vtree.hooks) {
        if (vtree.hooks.hasOwnProperty(key)) {
          var streamName = vtree.hooks[key].value;
          vtree.hooks[key].value = function (ev) { view[streamName].onNext(ev); };
        }
      }
      // TODO also the same, recursively in the vtree.children
      // TODO
      // traverse the vtree, replacing the value of 'ev-*' fields with
      // `function (ev) { view[$PREVIOUS_VALUE].onNext(ev); }`
      return vtree;
    });
    return view;
  },

  defineIntent: function (viewType, definitionFn) {
    var viewStub = {};
    for (var i = viewType.length - 1; i >= 0; i--) {
      viewStub[viewType[i]] = new Rx.Subject();
    }
    var intent = definitionFn(viewStub);
    intent.observe = function (view) {
      for (var key in viewStub) {
        if (viewStub.hasOwnProperty(key)) {
          if (!view.hasOwnProperty(key)) {
            throw new Error('View should have the required property ' + key);
          }
          replicate(view[key], viewStub[key]);
        }
      }
    };
    return intent;
  },

  connect: function (model, view, intent) {
    if (intent) { intent.observe(view); }
    if (view) { view.observe(model); }
    if (model) { model.observe(intent); }
  },

  // Submodules
  h: h,
  _delegator: new DOMDelegator()
};

module.exports = Cycle;
