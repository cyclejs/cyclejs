'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var DataFlowNode = require('../src/data-flow-node');

describe('DataFlowNode', function () {
  describe('constructor', function () {
    it('should throw an error when given no arguments', function () {
      assert.throws(function () {
        new DataFlowNode();
      });
    });

    it('should throw an error when given only interface', function () {
      assert.throws(function () {
        new DataFlowNode(['foo$', 'bar$']);
      });
    });

    it('should throw an error when definitionFn doesn\'t return object', function () {
      assert.throws(function () {
        new DataFlowNode(['foo$', 'bar$'], function () {});
      });
    });

    it('should return an object when given interface and definitionFn', function () {
      var dataFlowNode = new DataFlowNode([], function () { return {}; });
      assert.equal(typeof dataFlowNode, 'object');
    });

    it('should return an object with clone(), inject(), inputInterfaces', function () {
      var dataFlowNode = new DataFlowNode([], function () { return {}; });
      assert.equal(typeof dataFlowNode.clone, 'function');
      assert.equal(typeof dataFlowNode.inject, 'function');
      assert.equal(typeof dataFlowNode.inputInterfaces, 'object');
      assert.equal(Array.isArray(dataFlowNode.inputInterfaces), true);
    });
  });

  describe('injection', function () {
    it('should yield simple output when injected simple input', function (done) {
      var dataFlowNode = new DataFlowNode(['foo$'], function (input) {
        return {
          bar$: input.foo$.map(function () { return 'bar'; })
        };
      });
      dataFlowNode.bar$.subscribe(function (x) {
        assert.strictEqual(x, 'bar');
        done();
      });
      dataFlowNode.inject({foo$: Rx.Observable.just('foo')});
    });

    it('should yield simple output even when injected nothing', function (done) {
      var dataFlowNode = new DataFlowNode(function () {
        return {
          bar$: Rx.Observable.just(246)
        };
      });
      dataFlowNode.bar$.subscribe(function (x) {
        assert.strictEqual(x, 246);
        done();
      });
      dataFlowNode.inject();
    });

    it('should work also for a clone, in the simple output case', function (done) {
      var dataFlowNode = new DataFlowNode(['foo$'], function (input) {
        return {
          bar$: input.foo$.map(function () { return 'bar'; })
        };
      });
      var cloned = dataFlowNode.clone();
      cloned.bar$.subscribe(function (x) {
        assert.strictEqual(x, 'bar');
        done();
      });
      cloned.inject({foo$: Rx.Observable.just('foo')});
    });

    it('should be independent to injection in clones', function (done) {
      var dataFlowNode = new DataFlowNode(['number$'], function (input) {
        return {
          sum$: input.number$.map(function (x) { return x + 100; })
        };
      });
      var cloned = dataFlowNode.clone();
      Rx.Observable.zip(dataFlowNode.sum$, cloned.sum$, function (x, y) {
        return [x, y];
      }).subscribe(function (args) {
        assert.strictEqual(args[0], 103);
        assert.strictEqual(args[1], 107);
        done();
      });
      dataFlowNode.inject({number$: Rx.Observable.just(3)});
      cloned.inject({number$: Rx.Observable.just(7)});
    });

    it('should yield output when injected two inputs', function (done) {
      var dataFlowNode = new DataFlowNode(['x$'], ['y$'], function (input1, input2) {
        return {
          sum$: Rx.Observable
            .combineLatest(input1.x$, input2.y$, function (x, y) {
              return x + y;
            })
        };
      });
      dataFlowNode.sum$.subscribe(function (x) {
        assert.strictEqual(x, 15);
        done();
      });
      dataFlowNode.inject({x$: Rx.Observable.just(9)}, {y$: Rx.Observable.just(6)});
    });
  });
});
