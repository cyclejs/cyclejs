'use strict';

function CycleInterfaceError(message, missingMember) {
  this.name = 'CycleInterfaceError';
  this.message = (message || '');
  this.missingMember = (missingMember || '');
}
CycleInterfaceError.prototype = Error.prototype;

function customInterfaceErrorMessageInInject(dataFlowNode, message) {
  var originalInject = dataFlowNode.inject;
  dataFlowNode.inject = function inject() {
    try {
      return originalInject.apply({}, arguments);
    } catch (err) {
      if (err.name === 'CycleInterfaceError') {
        throw new CycleInterfaceError(message + err.missingMember, err.missingMember);
      } else {
        throw err;
      }
    }
  };
  return dataFlowNode;
}

module.exports = {
  CycleInterfaceError: CycleInterfaceError,
  customInterfaceErrorMessageInInject: customInterfaceErrorMessageInInject
};
