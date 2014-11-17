'use strict';
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

function defineModel() {
  var model = DataFlowNode.apply({}, arguments);
  model = errors.customInterfaceErrorMessageInInject(model,
    'Model expects Intent to have the required property '
  );
  var originalArgs = arguments;
  model.clone = function () {
    return defineModel.apply({}, originalArgs);
  };
  return model;
}

module.exports = defineModel;
