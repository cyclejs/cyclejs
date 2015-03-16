'use strict';
let DataFlowNodeWithCustomWarning = require('./data-flow-node-custom-warning');

class Intent extends DataFlowNodeWithCustomWarning {
  constructor(definitionFn) {
    this.type = 'Intent';
    super(definitionFn, 'Intent expects an input to have the required property ');
  }
}

module.exports = Intent;
