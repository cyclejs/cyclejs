'use strict';
let DataFlowNodeWithCustomWarning = require('./data-flow-node-custom-warning');

class Model extends DataFlowNodeWithCustomWarning {
  constructor(definitionFn) {
    this.type = 'Model';
    super(definitionFn, 'Model expects an input to have the required property ');
  }
}

module.exports = Model;
