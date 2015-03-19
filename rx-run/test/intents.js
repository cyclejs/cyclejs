'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');

describe('Intent', function () {
  it('should return an object when given definitionFn', function () {
    var intent = Cycle.createIntent(function () { return {}; });
    assert.equal(typeof intent, 'object');
  });

  it('should yield simple output when injected simple input', function (done) {
    var intent = Cycle.createIntent(function (input) {
      return {
        bar$: input.get('foo$').map(function () { return 'bar'; })
      };
    });
    intent.get('bar$').subscribe(function (x) {
      assert.strictEqual(x, 'bar');
      done();
    });
    intent.inject({foo$: Rx.Observable.just('foo')});
  });

  it('should yield simple output even when injected nothing', function (done) {
    var intent = Cycle.createIntent(function () {
      return {bar$: Rx.Observable.just(246)};
    });
    intent.get('bar$').subscribe(function (x) {
      assert.strictEqual(x, 246);
      done();
    });
    intent.inject();
  });

  it('should yield output when injected two inputs', function (done) {
    var intent = Cycle.createIntent(function (input1, input2) {
      return {
        sum$: Rx.Observable
          .combineLatest(input1.get('x$'), input2.get('y$'), function (x, y) {
            return x + y;
          })
      };
    });
    intent.get('sum$').subscribe(function (x) {
      assert.strictEqual(x, 15);
      done();
    });
    intent.inject({x$: Rx.Observable.just(9)}, {y$: Rx.Observable.just(6)});
  });
});
