'use strict';
/* global describe, it */
var assert = require('assert');
var DataFlowSink = require('../src/data-flow-sink');
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
  });

  it('should contain an inject function', function () {
    var sink = new DataFlowSink(function () {
      return Rx.Observable.just(2).subscribe(function () {});
    });
    assert.strictEqual(typeof sink.inject, 'function');
  });

  it('should not execute the definitionFn immediately', function () {
    assert.doesNotThrow(function () {
      new DataFlowSink(function (input) {
        return input.asd$.subscribe(function () {});
      });
    });
  });

  it('should return a Rx.Disposable when injected', function () {
    var sink = new DataFlowSink(function (input) {
      return input.asd$.subscribe(function () {});
    });
    var x = sink.inject({asd$: Rx.Observable.just(3)});
    var isDisposable = (typeof x.observer !== 'undefined') ||
      (typeof x.m !== 'undefined' && typeof x.m.dispose === 'function') ||
      (typeof x.subject !== 'undefined' && typeof x.subject.dispose !== 'function');
    assert.strictEqual(isDisposable, true);
  });
});
