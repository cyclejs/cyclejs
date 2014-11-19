'use strict';
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

function createModel() {
  var model = DataFlowNode.apply({}, arguments);
  model = errors.customInterfaceErrorMessageInInject(model,
    'Model expects Intent to have the required property '
  );
  var originalArgs = arguments;
  model.clone = function () {
    return createModel.apply({}, originalArgs);
  };
  return model;
}

module.exports = createModel;
