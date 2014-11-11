'use strict';
var h = require('virtual-hyperscript');
var BackwardFunction = require('./backward-function');
var Rendering = require('./rendering');

function PropertyHook(fn) {
  this.fn = fn;
}
PropertyHook.prototype.hook = function () {
  this.fn.apply(this, arguments);
};

var Cycle = {
  defineBackwardFunction: function (inputInterface, definitionFn) {
    return new BackwardFunction(inputInterface, definitionFn);
  },

  defineModel: require('./define-model'),
  defineView: require('./define-view'),
  defineIntent: require('./define-intent'),

  renderEvery: Rendering.renderEvery,

  link: function (model, view, intent) {
    // TODO generalize this with `arguments` array
    if (intent) { intent.inject(view); }
    if (view) { view.inject(model); }
    if (model) { model.inject(intent); }
  },

  vdomPropHook: function (fn) {
    return new PropertyHook(fn);
  },

  // Submodules
  h: h,
  _delegator: Rendering.delegator
};

module.exports = Cycle;
