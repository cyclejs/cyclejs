'use strict';
/* global describe, it */
var assert = require('assert');
var DataFlowSink = require('../../src/data-flow-sink');
var DataFlowNode = require('../../src/data-flow-node');
var Rx = require('rx');

describe('DataFlowSink', function () {
  describe('constructor', function () {
    it('should throw an error when given no arguments', function () {
      assert.throws(function () {
        new DataFlowSink();
      }, /DataFlowSink expects only one argument: the definition function/);
    });

    it('should throw an error when only interface', function () {
      assert.throws(function () {
        new DataFlowSink(['foo$', 'bar$']);
      }, /DataFlowSink expects the argument to be the definition function/);
    });

    it('should return an object with inject(), dispose()', function () {
      var dataFlowNode = new DataFlowSink(function () { return {}; });
      assert.equal(typeof dataFlowNode.inject, 'function');
      assert.equal(typeof dataFlowNode.dispose, 'function');
    });
  });

  it('should not execute the definitionFn immediately', function () {
    assert.doesNotThrow(function () {
      new DataFlowSink(function (input) {
        return input.get('asd$').subscribe(function () {});
      });
    });
  });

  describe('injection', function () {
    it('should return the same given input', function () {
      var sink = new DataFlowSink(function (input) {
        return input.get('foo$').subscribe(function () { });
      });
      var input = new DataFlowNode(function () {
        return {
          foo$: Rx.Observable.just(3)
        };
      });
      var x = sink.inject(input);
      assert.strictEqual(x, input);
    });

    it('should return an array of the inputs, if multiple inputs', function () {
      var sink = new DataFlowSink(function (input1, input2) {
        return input1.get('foo$').sample(input2.get('foo$')).subscribe(function () { });
      });
      var input1 = new DataFlowNode(function () {
        return {
          foo$: Rx.Observable.just(3)
        };
      });
      var input2 = new DataFlowNode(function () {
        return {
          foo$: Rx.Observable.just(2)
        };
      });
      var x = sink.inject(input1, input2);
      assert.strictEqual(Array.isArray(x), true);
      assert.strictEqual(x.length, 2);
      assert.strictEqual(x[0], input1);
      assert.strictEqual(x[1], input2);
    });
  });

  it('should not operate after dispose() has been called', function (done) {
    var outerVar = 0;
    var sink = new DataFlowSink(function (input) {
      return input.get('foo$').subscribe(x => outerVar = x);
    });
    var input = new DataFlowNode(function () {
      return {
        foo$: Rx.Observable.interval(100).map(x => x + 1).take(3)
      };
    });
    sink.inject(input);
    setTimeout(function () { sink.dispose(); }, 250);
    setTimeout(function () {
      assert.strictEqual(outerVar, 2);
      done();
    }, 400);
  });
});
