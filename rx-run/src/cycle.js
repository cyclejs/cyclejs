'use strict';
var h = require('virtual-hyperscript');
var DataFlowNode = require('./data-flow-node');
var Rendering = require('./rendering');
var Rx = require('rx');

function PropertyHook(fn) {
  this.fn = fn;
}
PropertyHook.prototype.hook = function () {
  this.fn.apply(this, arguments);
};

var Cycle = {
  defineDataFlowNode: function (inputInterface, definitionFn) {
    return new DataFlowNode(inputInterface, definitionFn);
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
  Rx: Rx,
  h: h,
  _delegator: Rendering.delegator
};

module.exports = Cycle;
