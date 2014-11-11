'use strict';
var BackwardFunction = require('./backward-function');
var errors = require('./errors');

function defineIntent(viewInterface, definitionFn) {
  var intent = new BackwardFunction(viewInterface, definitionFn);
  intent = errors.customInterfaceErrorMessageInInject(intent,
    'Intent expects View to have the required property '
  );
  intent.clone = function () {
    return defineIntent(viewInterface, definitionFn);
  };
  return intent;
}

module.exports = defineIntent;
