'use strict';

class CycleInterfaceError extends Error {
  constructor(message, missingMember) {
    this.name = 'CycleInterfaceError';
    this.message = (message || '');
    this.missingMember = (missingMember || '');
  }
}

module.exports = {
  CycleInterfaceError: CycleInterfaceError
};
