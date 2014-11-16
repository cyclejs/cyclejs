'use strict';
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

function defineIntent() {
  var intent = DataFlowNode.apply({}, arguments);
  intent = errors.customInterfaceErrorMessageInInject(intent,
    'Intent expects View to have the required property '
  );
  intent.clone = function () {
    return defineIntent.apply({}, arguments);
  };
  return intent;
}

module.exports = defineIntent;
