'use strict';

class DataFlowSource {
  constructor(outputObject) {
    if (arguments.length !== 1) {
      throw new Error('DataFlowSource expects only one argument: the output object.');
    }
    if (typeof outputObject !== 'object') {
      throw new Error('DataFlowSource expects the constructor argument to be the ' +
        'output object.'
      );
    }

    this.type = 'DataFlowSource';
    for (let key in outputObject) { if (outputObject.hasOwnProperty(key)) {
      this[key] = outputObject[key];
    }}
  }

  get(key) {
    return this[key];
  }

  inject() {
    throw new Error('A DataFlowSource cannot be injected. Use a DataFlowNode instead.');
  }

  dispose() {
    throw new Error('A DataFlowSource cannot be disposed. Use a DataFlowNode instead.');
  }
}

module.exports = DataFlowSource;
