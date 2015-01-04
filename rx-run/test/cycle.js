'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');
var DataFlowSource = require('../src/data-flow-source.js');
var DataFlowNode = require('../src/data-flow-node.js');
var DataFlowSink = require('../src/data-flow-sink.js');

describe('Cycle', function () {
  describe('API', function () {
    it('should have `createDataFlowNode`', function () {
      assert.strictEqual(typeof Cycle.createDataFlowNode, 'function');
    });

    it('should have `createDataFlowSource`', function () {
      assert.strictEqual(typeof Cycle.createDataFlowSource, 'function');
    });

    it('should have `createDataFlowSink`', function () {
      assert.strictEqual(typeof Cycle.createDataFlowSink, 'function');
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

    it('should have `createRenderer`', function () {
      assert.strictEqual(typeof Cycle.createRenderer, 'function');
    });

    it('should have `circularInject`', function () {
      assert.strictEqual(typeof Cycle.circularInject, 'function');
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

  describe('circularInject', function () {
    it('should tie MVI so that Model data is seen in Intent', function (done) {
      var fakeModel = Cycle.createDataFlowNode(function () {
        return {m$: Rx.Observable.just(2)};
      });
      var fakeView = Cycle.createDataFlowNode(function (model) {
        return {v$: model.get('m$').map(function (x) { return x * 3; })};
      });
      var fakeIntent = Cycle.createDataFlowNode(function (view) {
        return {i$: view.get('v$').map(function (x) { return x * 5; })};
      });
      fakeIntent.get('i$').subscribe(function (x) {
        assert.strictEqual(x, 30);
        done();
      });
      Cycle.circularInject(fakeModel, fakeView, fakeIntent);
    });

    it('should tie MVI so that Intent data (DELAYED) is seen in View', function (done) {
      var fakeModel = Cycle.createDataFlowNode(function (intent) {
        return {m$: intent.get('i$').startWith(2)};
      });
      var fakeView = Cycle.createDataFlowNode(function (model) {
        return {v$: model.get('m$').map(function (x) { return x * 3; })};
      });
      var fakeIntent = Cycle.createDataFlowNode(function () {
        return {i$: Rx.Observable.just(20).delay(200)};
      });
      fakeView.get('v$').skip(1).subscribe(function (x) {
        assert.strictEqual(x, 60);
        done();
      });
      Cycle.circularInject(fakeModel, fakeView, fakeIntent);
    });

    it('should accept 4 Data Flow Nodes as inputs', function (done) {
      var node1 = Cycle.createDataFlowNode(function () {
        return {one$: Rx.Observable.just(2)};
      });
      var node2 = Cycle.createDataFlowNode(function (node1) {
        return {two$: node1.get('one$').map(function (x) { return x * 3; })};
      });
      var node3 = Cycle.createDataFlowNode(function (node2) {
        return {three$: node2.get('two$').map(function (x) { return x * 5; })};
      });
      var node4 = Cycle.createDataFlowNode(function (node3) {
        return {four$: node3.get('three$').map(function (x) { return x * 7; })};
      });
      node4.get('four$').subscribe(function (x) {
        assert.strictEqual(x, 210);
        done();
      });
      Cycle.circularInject(node1, node2, node3, node4);
    });

    it('should accept 5 Data Flow Nodes as inputs', function (done) {
      var node1 = Cycle.createDataFlowNode(function () {
        return {one$: Rx.Observable.just(2)};
      });
      var node2 = Cycle.createDataFlowNode(function (node1) {
        return {two$: node1.get('one$').map(function (x) { return x * 3; })};
      });
      var node3 = Cycle.createDataFlowNode(function (node2) {
        return {three$: node2.get('two$').map(function (x) { return x * 5; })};
      });
      var node4 = Cycle.createDataFlowNode(function (node3) {
        return {four$: node3.get('three$').map(function (x) { return x * 7; })};
      });
      var node5 = Cycle.createDataFlowNode(function (node4) {
        return {five$: node4.get('four$').map(function (x) { return x * 11; })};
      });
      node5.get('five$').subscribe(function (x) {
        assert.strictEqual(x, 2310);
        done();
      });
      Cycle.circularInject(node1, node2, node3, node4, node5);
    });

    it('should accept 6 Data Flow Nodes as inputs', function (done) {
      var node1 = Cycle.createDataFlowNode(function () {
        return {one$: Rx.Observable.just(2)};
      });
      var node2 = Cycle.createDataFlowNode(function (node1) {
        return {two$: node1.get('one$').map(function (x) { return x * 3; })};
      });
      var node3 = Cycle.createDataFlowNode(function (node2) {
        return {three$: node2.get('two$').map(function (x) { return x * 5; })};
      });
      var node4 = Cycle.createDataFlowNode(function (node3) {
        return {four$: node3.get('three$').map(function (x) { return x * 7; })};
      });
      var node5 = Cycle.createDataFlowNode(function (node4) {
        return {five$: node4.get('four$').map(function (x) { return x * 11; })};
      });
      var node6 = Cycle.createDataFlowNode(function (node5) {
        return {six$: node5.get('five$').map(function (x) { return x * 13; })};
      });
      node6.get('six$').subscribe(function (x) {
        assert.strictEqual(x, 30030);
        done();
      });
      Cycle.circularInject(node1, node2, node3, node4, node5, node6);
    });
  });

  describe('Data Flow', function () {
    it('should not require Renderer injected before MVI injection', function (done) {
      var model = Cycle.createModel(function () {
        return {m$: Rx.Observable.just(2)};
      });
      var view = Cycle.createView(function (model) {
        return {
          events: [],
          vtree$: model.get('m$').map(function (x) { return Cycle.h('div', String(x)); }),
          v$: model.get('m$').map(function (x) { return x * 3; })
        };
      });
      var intent = Cycle.createIntent(function (view) {
        return {i$: view.get('v$').map(function (x) { return x * 5; })};
      });
      Cycle.circularInject(model, view, intent);
      view.get('vtree$').subscribe(function (x) {
        assert.strictEqual(x.type, 'VirtualNode');
        done();
      });
    });
  });

  describe('createDataFlowSource', function () {
    it('should return a DataFlowSource', function () {
      var sink = Cycle.createDataFlowSource({});
      assert.strictEqual(typeof sink, 'object');
      assert.strictEqual(typeof sink.inject, 'function');
      assert.strictEqual(sink instanceof DataFlowSource, true);
    });
  });

  describe('createDataFlowNode', function () {
    it('should return a DataFlowNode', function () {
      var sink = Cycle.createDataFlowNode(function () { return {}; });
      assert.strictEqual(typeof sink, 'object');
      assert.strictEqual(typeof sink.inject, 'function');
      assert.strictEqual(sink instanceof DataFlowNode, true);
    });
  });

  describe('createDataFlowSink', function () {
    it('should return a DataFlowSink', function () {
      var sink = Cycle.createDataFlowSink(function () {});
      assert.strictEqual(typeof sink, 'object');
      assert.strictEqual(typeof sink.inject, 'function');
      assert.strictEqual(sink instanceof DataFlowSink, true);
    });
  });
});
