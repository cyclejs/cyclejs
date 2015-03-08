'use strict';
let DataFlowNode = require('./data-flow-node');
let errors = require('./errors');

function createIntent(definitionFn) {
  let intent = new DataFlowNode(definitionFn);
  intent = errors.customInterfaceErrorMessageInInject(intent,
    'Intent expects View to have the required property '
  );
  intent.clone = function cloneIntent() { return createIntent(definitionFn); };
  return intent;
}

module.exports = createIntent;
