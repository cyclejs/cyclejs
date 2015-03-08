'use strict';
let Rx = require('rx');
let errors = require('./errors');
let InputProxy = require('./input-proxy');
let Utils = require('./utils');
let CycleInterfaceError = errors.CycleInterfaceError;

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
  let array = [];
  for (let streamName in output) { if (output.hasOwnProperty(streamName)) {
    if (Utils.endsWithDollarSign(streamName)) {
      array.push(streamName);
    }
  }}
  return array;
}

let replicateAll;

function DataFlowNode(definitionFn) {
  if (arguments.length !== 1 || typeof definitionFn !== 'function') {
    throw new Error('DataFlowNode expects the definitionFn as the only argument.');
  }
  let proxies = [];
  for (let i = 0; i < definitionFn.length; i++) {
    proxies[i] = new InputProxy();
  }
  let wasInjected = false;
  let output = definitionFn.apply(this, proxies);
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
    if (definitionFn.length !== arguments.length) {
      console.warn('The call to inject() should provide the inputs that this ' +
        'DataFlowNode expects according to its definition function.');
    }
    for (let i = 0; i < definitionFn.length; i++) {
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

function replicateAllEvent$(input, selector, proxyObj) {
  for (let eventName in proxyObj) { if (proxyObj.hasOwnProperty(eventName)) {
    if (eventName !== '_hasEvent$') {
      let event$ = input.event$(selector, eventName);
      if (event$ !== null) {
        replicate(event$, proxyObj[eventName]);
      }
    }
  }}
}

replicateAll = function replicateAll(input, proxy) {
  if (!input || !proxy) { return; }

  for (let key in proxy.proxiedProps) { if (proxy.proxiedProps.hasOwnProperty(key)) {
    let proxiedProperty = proxy.proxiedProps[key];
    if (typeof input.event$ === 'function' && proxiedProperty._hasEvent$) {
      replicateAllEvent$(input, key, proxiedProperty);
    } else if (!input.hasOwnProperty(key) && input instanceof InputProxy) {
      replicate(input.get(key), proxiedProperty);
    } else if (typeof input.get === 'function' && input.get(key) !== null) {
      replicate(input.get(key), proxiedProperty);
    } else if (typeof input === 'object' && input.hasOwnProperty(key)) {
      if (!input[key]) {
        input[key] = new Rx.Subject();
      }
      replicate(input[key], proxiedProperty);
    } else {
      throw new CycleInterfaceError('Input should have the required property ' +
        key, String(key)
      );
    }
  }}
};

module.exports = DataFlowNode;
