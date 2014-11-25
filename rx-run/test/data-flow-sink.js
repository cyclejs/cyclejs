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
      }, /DataFlowSink expects the definitionFn as the last argument/);
    });

    it('should throw an error when given only interface', function () {
      assert.throws(function () {
        new DataFlowSink(['foo$', 'bar$']);
      }, /DataFlowSink expects the definitionFn as the last argument/);
    });

    it('should throw an error if definitionFn doesn\'t return subscription', function () {
      assert.throws(function () {
        new DataFlowSink(['foo$', 'bar$'], function () {});
      }, /DataFlowSink should always return a Rx\.Disposable/);
    });
  });

  it('should contain an inject function', function () {
    var sink = new DataFlowSink(function () {
      return Rx.Observable.just(2).subscribe(function () {});
    });
    assert.strictEqual(typeof sink.inject, 'function');
  });

  it('should have stubs for future inputs', function () {
    assert.doesNotThrow(function () {
      new DataFlowSink(['asd$'], function (input) {
        return input.asd$.subscribe(function () {});
      });
    });
  });
});
