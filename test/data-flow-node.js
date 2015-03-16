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

    it('should throw an error when given an (interface) array', function () {
      assert.throws(function () {
        new DataFlowNode(['foo$', 'bar$']);
      });
    });

    it('should throw an error when definitionFn doesn\'t return object', function () {
      assert.throws(function () {
        new DataFlowNode(function () {});
      });
    });

    it('should return an object when given a definitionFn', function () {
      var dataFlowNode = new DataFlowNode(function () { return {}; });
      assert.equal(typeof dataFlowNode, 'object');
    });

    it('should return an object with inject(), get()', function () {
      var dataFlowNode = new DataFlowNode(function () { return {}; });
      assert.equal(typeof dataFlowNode.inject, 'function');
      assert.equal(typeof dataFlowNode.get, 'function');
    });
  });

  describe('injection', function () {
    it('should return the same given input', function () {
      var dataFlowNode = new DataFlowNode(function (input) {
        return {
          bar$: input.get('foo$').map(function () { return 'bar'; })
        };
      });
      var input = new DataFlowNode(function () {
        return {
          foo$: Rx.Observable.just(3)
        };
      });
      var x = dataFlowNode.inject(input);
      assert.strictEqual(x, input);
    });

    it('should return an array of the inputs, if multiple inputs', function () {
      var dataFlowNode = new DataFlowNode(function (input1, input2) {
        return {
          bar$: input1.get('foo$')
            .sample(input2.get('foo$'))
            .map(function () { return 'bar'; })
        };
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
      var x = dataFlowNode.inject(input1, input2);
      assert.strictEqual(Array.isArray(x), true);
      assert.strictEqual(x.length, 2);
      assert.strictEqual(x[0], input1);
      assert.strictEqual(x[1], input2);
    });

    it('should yield simple output when injected simple input', function (done) {
      var dataFlowNode = new DataFlowNode(function (input) {
        return {
          bar$: input.get('foo$').map(function () { return 'bar'; })
        };
      });
      dataFlowNode.get('bar$').subscribe(function (x) {
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
      dataFlowNode.get('bar$').subscribe(function (x) {
        assert.strictEqual(x, 246);
        done();
      });
      dataFlowNode.inject();
    });

    it('should work also for a clone, in the simple output case', function (done) {
      var definitionFn = function definitionFn(input) {
        return {
          bar$: input.get('foo$').map(function () { return 'bar'; })
        };
      };
      var dataFlowNode = new DataFlowNode(definitionFn);
      var cloned = new DataFlowNode(definitionFn);
      cloned.get('bar$').subscribe(function (x) {
        assert.strictEqual(x, 'bar');
        done();
      });
      cloned.inject({foo$: Rx.Observable.just('foo')});
    });

    it('should be independent to injection in clones', function (done) {
      var definitionFn = function definitionFn(input) {
        return {
          sum$: input.get('number$').map(function (x) { return x + 100; })
        };
      };
      var dataFlowNode = new DataFlowNode(definitionFn);
      var cloned = new DataFlowNode(definitionFn);
      Rx.Observable.zip(dataFlowNode.get('sum$'), cloned.get('sum$'), function (x, y) {
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
      var dataFlowNode = new DataFlowNode(function (input1, input2) {
        return {
          sum$: Rx.Observable
            .combineLatest(input1.get('x$'), input2.get('y$'), function (x, y) {
              return x + y;
            })
        };
      });
      dataFlowNode.get('sum$').subscribe(function (x) {
        assert.strictEqual(x, 15);
        done();
      });
      dataFlowNode.inject({x$: Rx.Observable.just(9)}, {y$: Rx.Observable.just(6)});
    });
  });
});
