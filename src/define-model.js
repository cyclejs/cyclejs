'use strict';
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

function defineModel() {
  var model = DataFlowNode.apply({}, arguments);
  model = errors.customInterfaceErrorMessageInInject(model,
    'Model expects Intent to have the required property '
  );
  model.clone = function () {
    return defineModel.apply({}, arguments);
  };
  return model;
}

module.exports = defineModel;
