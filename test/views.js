'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');

describe('defineView', function () {
  it('should throw error if output object does not have vtree$', function () {
    assert.throws(function () {
      Cycle.defineView([], function () { return {}; });
    });
  });

  it('should yield simple output even when injected nothing', function (done) {
    var view = Cycle.defineView(function () {
      return {
        vtree$: Rx.Observable.just(Cycle.h())
      };
    });
    view.vtree$.subscribe(function (x) {
      assert.strictEqual(typeof x, 'object');
      done();
    });
    view.inject();
  });
});
