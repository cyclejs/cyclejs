'use strict';
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

function createModel(definitionFn) {
  var model = new DataFlowNode(definitionFn);
  model = errors.customInterfaceErrorMessageInInject(model,
    'Model expects Intent to have the required property '
  );
  model.clone = function cloneModel() { return createModel(definitionFn); };
  return model;
}

module.exports = createModel;
