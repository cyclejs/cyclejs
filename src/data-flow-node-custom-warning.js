'use strict';
let DataFlowNode = require('./data-flow-node');
let errors = require('./errors');
let CycleInterfaceError = errors.CycleInterfaceError;

class DataFlowNodeWithCustomWarning extends DataFlowNode {
  constructor(definitionFn, cycleInterfaceErrorMessage) {
    this._cycleInterfaceErrorMessage = cycleInterfaceErrorMessage;
    super(definitionFn);
  }

  inject() {
    try {
      return super.inject.apply(this, arguments);
    } catch (err) {
      if (err.name === 'CycleInterfaceError') {
        throw new CycleInterfaceError(this._cycleInterfaceErrorMessage +
          err.missingMember, err.missingMember
        );
      } else {
        throw err;
      }
    }
  }
}

module.exports = DataFlowNodeWithCustomWarning;
