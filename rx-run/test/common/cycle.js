'use strict';
/* global describe, it */
var assert = require('assert');
var Cycle = require('../../src/cycle');

describe('Cycle', function () {
  describe('API', function () {
    it('should have `createDataFlowNode`', function () {
      assert.strictEqual(typeof Cycle.createDataFlowNode, 'function');
    });

    it('should return a DataFlowNode', function () {
      var sink = Cycle.createDataFlowNode(function () { return {}; });
      assert.strictEqual(typeof sink, 'object');
      assert.strictEqual(typeof sink.inject, 'function');
      assert.strictEqual(sink.type, 'DataFlowNode', true);
    });

    it('should have `createDataFlowSource`', function () {
      assert.strictEqual(typeof Cycle.createDataFlowSource, 'function');
    });

    it('createDataFlowSource should return a DataFlowSource', function () {
      var sink = Cycle.createDataFlowSource({});
      assert.strictEqual(typeof sink, 'object');
      assert.strictEqual(typeof sink.inject, 'function');
      assert.strictEqual(sink.type, 'DataFlowSource', true);
    });

    it('should have `createDataFlowSink`', function () {
      assert.strictEqual(typeof Cycle.createDataFlowSink, 'function');
    });

    it('should return a DataFlowSink', function () {
      var sink = Cycle.createDataFlowSink(function () {});
      assert.strictEqual(typeof sink, 'object');
      assert.strictEqual(typeof sink.inject, 'function');
      assert.strictEqual(sink.type, 'DataFlowSink', true);
    });

    it('should have `createModel`', function () {
      assert.strictEqual(typeof Cycle.createModel, 'function');
    });

    it('should have `createView`', function () {
      assert.strictEqual(typeof Cycle.createView, 'function');
    });

    it('should have `createIntent`', function () {
      assert.strictEqual(typeof Cycle.createIntent, 'function');
    });

    it('should have `createDOMUser`', function () {
      assert.strictEqual(typeof Cycle.createDOMUser, 'function');
    });

    it('should have `registerCustomElement`', function () {
      assert.strictEqual(typeof Cycle.registerCustomElement, 'function');
    });

    it('should have `vdomPropHook`', function () {
      assert.strictEqual(typeof Cycle.vdomPropHook, 'function');
    });

    it('should have a shortcut to Rx', function () {
      assert.strictEqual(typeof Cycle.Rx, 'object');
    });

    it('should have a shortcut to virtual-hyperscript', function () {
      assert.strictEqual(typeof Cycle.h, 'function');
    });
  });
});
