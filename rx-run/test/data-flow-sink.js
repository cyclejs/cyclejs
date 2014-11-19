'use strict';
/* global describe, it */
var assert = require('assert');
var DataFlowSink = require('../src/data-flow-sink');

describe('DataFlowSink', function () {
  describe('constructor', function () {
    it('should throw an error when given no arguments', function () {
      assert.throws(function () {
        new DataFlowSink();
      }, /DataFlowSink expects only one argument: the definition function/);
    });

    it('should throw an error when first argument is not a function', function () {
      assert.throws(function () {
        new DataFlowSink('foo');
      }, /DataFlowSink expects the argument to be the definition function/);
    });

    it('should throw an error when given more than one argument', function () {
      assert.throws(function () {
        new DataFlowSink(function () {
        }, 'foo');
      }, /DataFlowSink expects only one argument: the definition function/);
    });
  });

  it('should contain an inject function', function () {
    var sink = new DataFlowSink(function () {});
    assert.strictEqual(typeof sink.inject, 'function');
  });
});
