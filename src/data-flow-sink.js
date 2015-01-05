'use strict';

function makeLightweightInputProxies(args) {
  return Array.prototype
    .slice.call(args)
    .map(function (arg) {
      return {
        get: function get(streamName) {
          if (typeof arg.get === 'function') {
            return arg.get(streamName);
          } else {
            return arg[streamName] || null;
          }
        }
      };
    });
}

function DataFlowSink(definitionFn) {
  if (arguments.length !== 1) {
    throw new Error('DataFlowSink expects only one argument: the definition function.');
  }
  if (typeof definitionFn !== 'function') {
    throw new Error('DataFlowSink expects the argument to be the definition function.');
  }
  definitionFn.displayName += '(DataFlowSink defFn)';
  this.inject = function injectIntoDataFlowSink() {
    var proxies = makeLightweightInputProxies(arguments);
    return definitionFn.apply({}, proxies);
  };
  return this;
}

module.exports = DataFlowSink;
