'use strict';

function CycleInterfaceError(message, missingMember) {
  this.name = 'CycleInterfaceError';
  this.message = (message || '');
  this.missingMember = (missingMember || '');
}
CycleInterfaceError.prototype = Error.prototype;

function customInterfaceErrorMessageInInject(backwardFn, message) {
  var originalInject = backwardFn.inject;
  backwardFn.inject = function (input) {
    try {
      originalInject(input);
    } catch (err) {
      if (err.name === 'CycleInterfaceError') {
        throw new CycleInterfaceError(message + err.missingMember, err.missingMember);
      } else {
        throw err;
      }
    }
  };
  return backwardFn;
}

module.exports = {
  CycleInterfaceError: CycleInterfaceError,
  customInterfaceErrorMessageInInject: customInterfaceErrorMessageInInject
};
