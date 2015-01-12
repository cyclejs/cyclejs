'use strict';
var Rx = require('rx');
var errors = require('./errors');
var InputProxy = require('./input-proxy');
var Utils = require('./utils');
var CycleInterfaceError = errors.CycleInterfaceError;

function replicate(source, subject) {
  if (typeof source === 'undefined') {
    throw new Error('Cannot replicate() if source is undefined.');
  }
  return source.subscribe(
    function replicationOnNext(x) {
      subject.onNext(x);
    },
    function replicationOnError(err) {
      subject.onError(err);
      console.error(err);
    }
  );
}

function checkOutputObject(output) {
  if (typeof output !== 'object') {
    throw new Error('A DataFlowNode should always return an object.');
  }
}

function createStreamNamesArray(output) {
  var array = [];
  for (var streamName in output) {
    if (output.hasOwnProperty(streamName) && Utils.endsWithDolarSign(streamName)) {
      array.push(streamName);
    }
  }
  return array;
}

var replicateAll;

function DataFlowNode(definitionFn) {
  if (arguments.length !== 1 || typeof definitionFn !== 'function') {
    throw new Error('DataFlowNode expects the definitionFn as the only argument.');
  }
  var proxies = [];
  for (var i = 0; i < definitionFn.length; i++) {
    proxies[i] = new InputProxy();
  }
  var wasInjected = false;
  var output = definitionFn.apply(this, proxies);
  checkOutputObject(output);
  this.outputStreams = createStreamNamesArray(output);
  this.get = function get(streamName) {
    return output[streamName] || null;
  };
  this.clone = function clone() {
    return new DataFlowNode(definitionFn);
  };
  this.inject = function inject() {
    if (wasInjected) {
      console.warn('DataFlowNode has already been injected an input.');
    }
    if (!this._inCustomElement && definitionFn.length !== arguments.length) {
      console.warn('The call to inject() should provide the inputs that this ' +
        'DataFlowNode expects according to its definition function.');
    }
    for (var i = 0; i < definitionFn.length; i++) {
      replicateAll(arguments[i], proxies[i]);
    }
    wasInjected = true;
    if (arguments.length === 1) {
      return arguments[0];
    } else if (arguments.length > 1) {
      return Array.prototype.slice.call(arguments);
    } else {
      return null;
    }
  };
  return this;
}

replicateAll = function replicateAll(input, proxy) {
  if (!input || !proxy) {
    return;
  }
  for (var key in proxy.proxiedProps) {
    if (proxy.proxiedProps.hasOwnProperty(key)) {
      if (!input.hasOwnProperty(key) && input instanceof InputProxy) {
        input.proxiedProps[key] = new Rx.Subject();
        replicate(input.proxiedProps[key], proxy.proxiedProps[key]);
      } else if (input instanceof DataFlowNode && input.get(key) !== null) {
        replicate(input.get(key), proxy.proxiedProps[key]);
      } else if (typeof input === 'object' && input.hasOwnProperty(key)) {
        if (!input[key]) {
          input[key] = new Rx.Subject();
        }
        replicate(input[key], proxy.proxiedProps[key]);
      } else {
        throw new CycleInterfaceError('Input should have the required property ' +
          key, String(key)
        );
      }
    }
  }
};

module.exports = DataFlowNode;
