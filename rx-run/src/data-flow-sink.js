'use strict';
var DataFlowNode = require('./data-flow-node');

function checkOutput(output) {
  var error = new Error('A DataFlowSink should always return a Rx.Disposable.');
  if (typeof output !== 'object') {
    throw error;
  }
  if (typeof output.observer === 'undefined') {
    throw error;
  }
  if (typeof output.m !== 'undefined' && typeof output.m.dispose !== 'function') {
    throw error;
  }
  if (typeof output.subject !== 'undefined' &&
    typeof output.subject.dispose !== 'function')
  {
    throw error;
  }
}

function DataFlowSink() {
  try {
    DataFlowNode.apply(this, arguments);
    checkOutput(this);
    return this;
  } catch (err) {
    if (err.message.match(/DataFlowNode expects the definitionFn as the last argument/)) {
      throw new Error('DataFlowSink expects the definitionFn as the last argument.');
    } else if (err.message.match(/DataFlowNode should always return an object/)) {
      throw new Error('DataFlowSink should always return a Rx.Disposable. Hint: you ' +
        'should subscribe to the Observables from the input data flow nodes.'
      );
    } else {
      throw err;
    }
  }
}

DataFlowSink.prototype = Object.create(DataFlowNode.prototype);

//function DataFlowSink(definitionFn) {
//  if (arguments.length !== 1) {
//    throw new Error('DataFlowSink expects only one argument: the definition function.');
//  }
//  if (typeof definitionFn !== 'function') {
//    throw new Error('DataFlowSink expects the argument to be the definition function.');
//  }
//  definitionFn.displayName += '(DataFlowSink defFn)';
//  this.inject = function injectIntoDataFlowSink() {
//    return definitionFn.apply({}, arguments);
//  };
//}

module.exports = DataFlowSink;
