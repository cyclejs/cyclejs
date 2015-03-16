'use strict';

class DataFlowSink {
  constructor(definitionFn) {
    if (arguments.length !== 1) {
      throw new Error('DataFlowSink expects only one argument: the definition function.');
    }
    if (typeof definitionFn !== 'function') {
      throw new Error('DataFlowSink expects the argument to be the definition function.');
    }

    definitionFn.displayName += '(DataFlowSink defFn)';
    this.type = 'DataFlowSink';
    this._definitionFn = definitionFn;
  }

  inject() {
    let proxies = DataFlowSink.makeLightweightInputProxies(arguments);
    return this._definitionFn.apply({}, proxies);
  }

  static makeLightweightInputProxies(args) {
    return Array.prototype
      .slice.call(args)
      .map(arg =>
        ({
          get(streamName) {
            if (typeof arg.get === 'function') {
              return arg.get(streamName);
            } else {
              return arg[streamName] || null;
            }
          }
        })
      );
  }
}

module.exports = DataFlowSink;
