'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var BackwardFunction = require('../src/backward-function');

describe('BackwardFunction', function () {
  describe('constructor', function () {
    it('should throw an error when given no arguments', function () {
      assert.throws(function () {
        new BackwardFunction();
      });
    });

    it('should throw an error when given only interface', function () {
      assert.throws(function () {
        new BackwardFunction(['foo$', 'bar$']);
      });
    });

    it('should throw an error when definitionFn doesn\'t return object', function () {
      assert.throws(function () {
        new BackwardFunction(['foo$', 'bar$'], function () {});
      });
    });

    it('should return an object when given interface and definitionFn', function () {
      var backwardFn = new BackwardFunction([], function () { return {}; });
      assert.equal(typeof backwardFn, 'object');
    });

    it('should return an object with .clone() and .inject()', function () {
      var backwardFn = new BackwardFunction([], function () { return {}; });
      assert.equal(typeof backwardFn.clone, 'function');
      assert.equal(typeof backwardFn.inject, 'function');
    });
  });

  describe('injection', function () {
    it('should yield simple output when injected simple input', function (done) {
      var backwardFn = new BackwardFunction(['foo$'], function (input) {
        return {
          bar$: input.foo$.map(function () { return 'bar'; })
        };
      });
      backwardFn.bar$.subscribe(function (x) {
        assert.strictEqual(x, 'bar');
        done();
      });
      backwardFn.inject({foo$: Rx.Observable.just('foo')});
    });

    it('should work also for a clone, in the simple output case', function (done) {
      var backwardFn = new BackwardFunction(['foo$'], function (input) {
        return {
          bar$: input.foo$.map(function () { return 'bar'; })
        };
      });
      var cloned = backwardFn.clone();
      cloned.bar$.subscribe(function (x) {
        assert.strictEqual(x, 'bar');
        done();
      });
      cloned.inject({foo$: Rx.Observable.just('foo')});
    });

    it('should be independent to injection in clones', function (done) {
      var backwardFn = new BackwardFunction(['number$'], function (input) {
        return {
          sum$: input.number$.map(function (x) { return x + 100; })
        };
      });
      var cloned = backwardFn.clone();
      Rx.Observable.zip(backwardFn.sum$, cloned.sum$, function (x, y) {
        return [x, y];
      }).subscribe(function (args) {
        assert.strictEqual(args[0], 103);
        assert.strictEqual(args[1], 107);
        done();
      });
      backwardFn.inject({number$: Rx.Observable.just(3)});
      cloned.inject({number$: Rx.Observable.just(7)});
    });

    it('should yield output when injected two inputs', function (done) {
      var backwardFn = new BackwardFunction(['x$'], ['y$'], function (input1, input2) {
        return {
          sum$: Rx.Observable
            .combineLatest(input1.x$, input2.y$, function (x, y) {
              return x + y;
            })
        };
      });
      backwardFn.sum$.subscribe(function (x) {
        assert.strictEqual(x, 15);
        done();
      });
      backwardFn.inject({x$: Rx.Observable.just(9)}, {y$: Rx.Observable.just(6)});
    });
  });
});
