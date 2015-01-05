'use strict';
var DataFlowNode = require('./data-flow-node');
var errors = require('./errors');

function createIntent(definitionFn) {
  var intent = new DataFlowNode(definitionFn);
  intent = errors.customInterfaceErrorMessageInInject(intent,
    'Intent expects View to have the required property '
  );
  intent.clone = function cloneIntent() { return createIntent(definitionFn); };
  return intent;
}

module.exports = createIntent;
