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
    this._subscription = this._definitionFn.apply({}, proxies);
    if (arguments.length === 1) {
      return arguments[0];
    } else if (arguments.length > 1) {
      return Array.prototype.slice.call(arguments);
    } else {
      return null;
    }
  }

  dispose() {
    if (this._subscription && typeof this._subscription.dispose === 'function') {
      this._subscription.dispose();
    }
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
