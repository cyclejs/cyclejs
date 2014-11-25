'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../src/cycle');

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
      var fakeModel = Cycle.createDataFlowNode(['i$'], function () {
        return {m$: Rx.Observable.just(2)};
      });
      var fakeView = Cycle.createDataFlowNode(['m$'], function (model) {
        return {v$: model.m$.map(function (x) { return x * 3; })};
      });
      var fakeIntent = Cycle.createDataFlowNode(['v$'], function (view) {
        return {i$: view.v$.map(function (x) { return x * 5; })};
      });
      fakeIntent.i$.subscribe(function (x) {
        assert.strictEqual(x, 30);
        done();
      });
      Cycle.circularInject(fakeModel, fakeView, fakeIntent);
    });

    it('should tie MVI so that Intent data (DELAYED) is seen in View', function (done) {
      var fakeModel = Cycle.createDataFlowNode(['i$'], function (intent) {
        return {m$: intent.i$.startWith(2)};
      });
      var fakeView = Cycle.createDataFlowNode(['m$'], function (model) {
        return {v$: model.m$.map(function (x) { return x * 3; })};
      });
      var fakeIntent = Cycle.createDataFlowNode(['v$'], function () {
        return {i$: Rx.Observable.just(20).delay(200)};
      });
      fakeView.v$.skip(1).subscribe(function (x) {
        assert.strictEqual(x, 60);
        done();
      });
      Cycle.circularInject(fakeModel, fakeView, fakeIntent);
    });

    it('should accept 4 Data Flow Nodes as inputs', function (done) {
      var node1 = Cycle.createDataFlowNode(function () {
        return {one$: Rx.Observable.just(2)};
      });
      var node2 = Cycle.createDataFlowNode(['one$'], function (node1) {
        return {two$: node1.one$.map(function (x) { return x * 3; })};
      });
      var node3 = Cycle.createDataFlowNode(['two$'], function (node2) {
        return {three$: node2.two$.map(function (x) { return x * 5; })};
      });
      var node4 = Cycle.createDataFlowNode(['three$'], function (node3) {
        return {four$: node3.three$.map(function (x) { return x * 7; })};
      });
      node4.four$.subscribe(function (x) {
        assert.strictEqual(x, 210);
        done();
      });
      Cycle.circularInject(node1, node2, node3, node4);
    });

    it('should accept 5 Data Flow Nodes as inputs', function (done) {
      var node1 = Cycle.createDataFlowNode(function () {
        return {one$: Rx.Observable.just(2)};
      });
      var node2 = Cycle.createDataFlowNode(['one$'], function (node1) {
        return {two$: node1.one$.map(function (x) { return x * 3; })};
      });
      var node3 = Cycle.createDataFlowNode(['two$'], function (node2) {
        return {three$: node2.two$.map(function (x) { return x * 5; })};
      });
      var node4 = Cycle.createDataFlowNode(['three$'], function (node3) {
        return {four$: node3.three$.map(function (x) { return x * 7; })};
      });
      var node5 = Cycle.createDataFlowNode(['four$'], function (node4) {
        return {five$: node4.four$.map(function (x) { return x * 11; })};
      });
      node5.five$.subscribe(function (x) {
        assert.strictEqual(x, 2310);
        done();
      });
      Cycle.circularInject(node1, node2, node3, node4, node5);
    });

    it('should accept 6 Data Flow Nodes as inputs', function (done) {
      var node1 = Cycle.createDataFlowNode(function () {
        return {one$: Rx.Observable.just(2)};
      });
      var node2 = Cycle.createDataFlowNode(['one$'], function (node1) {
        return {two$: node1.one$.map(function (x) { return x * 3; })};
      });
      var node3 = Cycle.createDataFlowNode(['two$'], function (node2) {
        return {three$: node2.two$.map(function (x) { return x * 5; })};
      });
      var node4 = Cycle.createDataFlowNode(['three$'], function (node3) {
        return {four$: node3.three$.map(function (x) { return x * 7; })};
      });
      var node5 = Cycle.createDataFlowNode(['four$'], function (node4) {
        return {five$: node4.four$.map(function (x) { return x * 11; })};
      });
      var node6 = Cycle.createDataFlowNode(['five$'], function (node5) {
        return {six$: node5.five$.map(function (x) { return x * 13; })};
      });
      node6.six$.subscribe(function (x) {
        assert.strictEqual(x, 30030);
        done();
      });
      Cycle.circularInject(node1, node2, node3, node4, node5, node6);
    });
  });

  describe('Data Flow', function () {
    it('should not require Renderer injected before MVI injection', function (done) {
      var model = Cycle.createModel(['i$'], function () {
        return {m$: Rx.Observable.just(2)};
      });
      var view = Cycle.createView(['m$'], function (model) {
        return {
          events: [],
          vtree$: model.m$.map(function (x) { return Cycle.h('div', String(x)); }),
          v$: model.m$.map(function (x) { return x * 3; })
        };
      });
      var intent = Cycle.createIntent(['v$'], function (view) {
        return {i$: view.v$.map(function (x) { return x * 5; })};
      });
      Cycle.circularInject(model, view, intent);
      view.vtree$.subscribe(function (x) {
        assert.strictEqual(x.type, 'VirtualNode');
        done();
      });
      view.events = [];
    });
  });
});
