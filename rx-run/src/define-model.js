'use strict';
var BackwardFunction = require('./backward-function');
var errors = require('./errors');

function defineModel(intentInterface, definitionFn) {
  var model = new BackwardFunction(intentInterface, definitionFn);
  model = errors.customInterfaceErrorMessageInInject(model,
    'Model expects Intent to have the required property '
  );
  model.clone = function () {
    return defineModel(intentInterface, definitionFn);
  };
  return model;
}

module.exports = defineModel;
