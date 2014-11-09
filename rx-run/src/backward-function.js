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
      console.error(err);
    }
  );
}

function checkInputInterfaceArray(inputInterface) {
  if (!Array.isArray(inputInterface)) {
    throw new Error('Expected an array as the interface of the input for \n' +
      'the Backward Function.'
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
    throw new Error('Backward Functions should always return an object.');
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

function BackwardFunction(inputInterface, definitionFn) {
  var inputStub = {};
  var wasInjected = false;
  if (typeof inputInterface !== 'undefined') {
    checkInputInterfaceArray(inputInterface);
    checkInputInterfaceOnlyStrings(inputInterface);
    makeStubPropertiesFromInterface(inputStub, inputInterface);
  }
  var output = definitionFn(inputStub);
  checkOutputObject(output);
  copyProperties(output, this);
  this.inject = function (input) {
    if (wasInjected) {
      console.warn('Backward Function has already been injected an input.');
    }
    replicateAll(input, inputStub);
    wasInjected = true;
  };
  this.clone = function () {
    return new BackwardFunction(inputInterface, definitionFn);
  };
}

module.exports = BackwardFunction;
