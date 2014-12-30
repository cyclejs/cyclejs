'use strict';
var Rx = require('rx');
var errors = require('./errors');
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

function checkInputInterfaceArray(inputInterface) {
  if (!Array.isArray(inputInterface)) {
    throw new Error('Expected an array as the interface of the input for \n' +
      'the DataFlowNode.'
    );
  }
}

function checkInputInterfaceOnlyStrings(inputInterface) {
  for (var i = inputInterface.length - 1; i >= 0; i--) {
    if (typeof inputInterface[i] !== 'string') {
      throw new Error('Expected strings as names of properties in the input interface');
    }
  }
}

function makeStubPropertiesFromInterface(inputStub, inputInterface) {
  for (var i = inputInterface.length - 1; i >= 0; i--) {
    inputStub[inputInterface[i]] = new Rx.Subject();
  }
}

function checkOutputObject(output) {
  if (typeof output !== 'object') {
    throw new Error('A DataFlowNode should always return an object.');
  }
}

function copyProperties(orig, dest) {
  for (var key in orig) {
    if (orig.hasOwnProperty(key)) {
      dest[key] = orig[key];
    }
  }
}

function replicateAll(input, stub) {
  for (var key in stub) {
    if (stub.hasOwnProperty(key)) {
      if (!input.hasOwnProperty(key)) {
        throw new CycleInterfaceError('Input should have the required property ' +
          key, String(key)
        );
      }
      replicate(input[key], stub[key]);
    }
  }
}

function DataFlowNode() {
  var args = Array.prototype.slice.call(arguments);
  var definitionFn = args.pop();
  if (typeof definitionFn !== 'function') {
    throw new Error('DataFlowNode expects the definitionFn as the last argument.');
  }
  var interfaces = args;
  var inputStubs = interfaces.map(function () { return {}; });
  var wasInjected = false;
  for (var i = interfaces.length - 1; i >= 0; i--) {
    checkInputInterfaceArray(interfaces[i]);
    checkInputInterfaceOnlyStrings(interfaces[i]);
    makeStubPropertiesFromInterface(inputStubs[i], interfaces[i]);
  }
  var output = definitionFn.apply(this, inputStubs);
  checkOutputObject(output);
  copyProperties(output, this);
  this.inputInterfaces = interfaces;
  this.inject = function injectIntoDataFlowNode() {
    if (wasInjected) {
      console.warn('DataFlowNode has already been injected an input.');
    }
    for (var i = arguments.length - 1; i >= 0; i--) {
      replicateAll(arguments[i], inputStubs[i]);
    }
    wasInjected = true;
  };
  this.clone = function () {
    return DataFlowNode.apply({}, interfaces.concat([definitionFn]));
  };
  return this;
}

module.exports = DataFlowNode;
