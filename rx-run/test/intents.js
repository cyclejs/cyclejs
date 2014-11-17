'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');

describe('defineIntent', function () {
  it('should return an object when given interface and definitionFn', function () {
    var intent = Cycle.defineIntent([], function () { return {}; });
    assert.equal(typeof intent, 'object');
  });

  it('should yield simple output when injected simple input', function (done) {
    var intent = Cycle.defineIntent(['foo$'], function (input) {
      return {
        bar$: input.foo$.map(function () { return 'bar'; })
      };
    });
    intent.bar$.subscribe(function (x) {
      assert.strictEqual(x, 'bar');
      done();
    });
    intent.inject({foo$: Rx.Observable.just('foo')});
  });

  it('should yield simple output even when injected nothing', function (done) {
    var intent = Cycle.defineIntent(function () {
      return {
        bar$: Rx.Observable.just(246)
      };
    });
    intent.bar$.subscribe(function (x) {
      assert.strictEqual(x, 246);
      done();
    });
    intent.inject();
  });

  it('should yield output when injected two inputs', function (done) {
    var intent = Cycle.defineIntent(['x$'], ['y$'], function (input1, input2) {
      return {
        sum$: Rx.Observable
          .combineLatest(input1.x$, input2.y$, function (x, y) {
            return x + y;
          })
      };
    });
    intent.sum$.subscribe(function (x) {
      assert.strictEqual(x, 15);
      done();
    });
    intent.inject({x$: Rx.Observable.just(9)}, {y$: Rx.Observable.just(6)});
  });

  it('should be cloneable', function (done) {
    var intent = Cycle.defineIntent(['foo$'], function (input) {
      return {
        bar$: input.foo$.map(function () { return 'bar'; })
      };
    });
    var clone = intent.clone();
    clone.bar$.subscribe(function (x) {
      assert.strictEqual(x, 'bar');
      done();
    });
    intent.inject({foo$: Rx.Observable.just('foo')});
    clone.inject({foo$: Rx.Observable.just('foo')});
  });
});
