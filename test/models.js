'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');

describe('defineModel', function () {
  it('should return an object when given interface and definitionFn', function () {
    var model = Cycle.defineModel([], function () { return {}; });
    assert.equal(typeof model, 'object');
  });

  it('should yield simple output when injected simple input', function (done) {
    var model = Cycle.defineModel(['foo$'], function (input) {
      return {
        bar$: input.foo$.map(function () { return 'bar'; })
      };
    });
    model.bar$.subscribe(function (x) {
      assert.strictEqual(x, 'bar');
      done();
    });
    model.inject({foo$: Rx.Observable.just('foo')});
  });

  it('should yield simple output even when injected nothing', function (done) {
    var model = Cycle.defineModel(function () {
      return {
        bar$: Rx.Observable.just(246)
      };
    });
    model.bar$.subscribe(function (x) {
      assert.strictEqual(x, 246);
      done();
    });
    model.inject();
  });

  it('should yield output when injected two inputs', function (done) {
    var model = Cycle.defineModel(['x$'], ['y$'], function (input1, input2) {
      return {
        sum$: Rx.Observable
          .combineLatest(input1.x$, input2.y$, function (x, y) {
            return x + y;
          })
      };
    });
    model.sum$.subscribe(function (x) {
      assert.strictEqual(x, 15);
      done();
    });
    model.inject({x$: Rx.Observable.just(9)}, {y$: Rx.Observable.just(6)});
  });
});
