'use strict';
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

function createIntent() {
  var intent = DataFlowNode.apply({}, arguments);
  intent = errors.customInterfaceErrorMessageInInject(intent,
    'Intent expects View to have the required property '
  );
  var originalArgs = arguments;
  intent.clone = function () {
    return createIntent.apply({}, originalArgs);
  };
  return intent;
}

module.exports = createIntent;
