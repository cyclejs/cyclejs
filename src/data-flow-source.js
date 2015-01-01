'use strict';

function DataFlowSource(outputObject) {
  if (arguments.length !== 1) {
    throw new Error('DataFlowSource expects only one argument: the output object.');
  }
  if (typeof outputObject !== 'object') {
    throw new Error('DataFlowSource expects the constructor argument to be the ' +
      'output object.'
    );
  }
  for (var key in outputObject) {
    if (outputObject.hasOwnProperty(key)) {
      this[key] = outputObject[key];
    }
  }
  this.inject = function injectDataFlowSource() {
    throw new Error('A DataFlowSource cannot be injected. Use a DataFlowNode instead.');
  };
  return this;
}

module.exports = DataFlowSource;
