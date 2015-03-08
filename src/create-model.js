'use strict';
let DataFlowNode = require('./data-flow-node');
let errors = require('./errors');

function createModel(definitionFn) {
  let model = new DataFlowNode(definitionFn);
  model = errors.customInterfaceErrorMessageInInject(model,
    'Model expects Intent to have the required property '
  );
  model.clone = function cloneModel() { return createModel(definitionFn); };
  return model;
}

module.exports = createModel;
