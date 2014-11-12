'use strict';
var BackwardFunction = require('./backward-function');
var errors = require('./errors');

function defineIntent() {
  var intent = BackwardFunction.apply({}, arguments);
  intent = errors.customInterfaceErrorMessageInInject(intent,
    'Intent expects View to have the required property '
  );
  intent.clone = function () {
    return defineIntent.apply({}, arguments);
  };
  return intent;
}

module.exports = defineIntent;
