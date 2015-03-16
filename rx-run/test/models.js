'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');

describe('createModel', function () {
  it('should return an object when given definitionFn', function () {
    var model = Cycle.createModel(function () { return {}; });
    assert.equal(typeof model, 'object');
  });

  it('should yield simple output when injected simple input', function (done) {
    var model = Cycle.createModel(function (input) {
      return {
        bar$: input.get('foo$').map(function () { return 'bar'; })
      };
    });
    model.get('bar$').subscribe(function (x) {
      assert.strictEqual(x, 'bar');
      done();
    });
    model.inject({foo$: Rx.Observable.just('foo')});
  });

  it('should yield simple output even when injected nothing', function (done) {
    var model = Cycle.createModel(function () {
      return {
        bar$: Rx.Observable.just(246)
      };
    });
    model.get('bar$').subscribe(function (x) {
      assert.strictEqual(x, 246);
      done();
    });
    model.inject();
  });

  it('should yield output when injected two inputs', function (done) {
    var model = Cycle.createModel(function (input1, input2) {
      return {
        sum$: Rx.Observable
          .combineLatest(input1.get('x$'), input2.get('y$'), function (x, y) {
            return x + y;
          })
      };
    });
    model.get('sum$').subscribe(function (x) {
      assert.strictEqual(x, 15);
      done();
    });
    model.inject({x$: Rx.Observable.just(9)}, {y$: Rx.Observable.just(6)});
  });
});
