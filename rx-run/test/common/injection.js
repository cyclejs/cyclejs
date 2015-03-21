'use strict';
/* global describe, it */
var assert = require('assert');
var Rx = require('rx');
var Cycle = require('../../src/cycle');

describe('Injection', function () {
  it('should correctly propagate data along DataFlowNodes', function (done) {
    var dfn1 = Cycle.createDataFlowNode(function () {
      return {m$: Rx.Observable.just(2)};
    });
    var dfn2 = Cycle.createDataFlowNode(function (model) {
      return {v$: model.get('m$').map(function (x) { return x * 3; })};
    });
    var dfn3 = Cycle.createDataFlowNode(function (view) {
      return {i$: view.get('v$').map(function (x) { return x * 5; })};
    });
    dfn3.get('i$').subscribe(function (x) {
      assert.strictEqual(x, 30);
      done();
    });
    dfn3.inject(dfn2).inject(dfn1);
  });

  it('should propagate delayed intent event up until view', function (done) {
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
    fakeView.inject(fakeModel).inject(fakeIntent);
  });

  it('should handle 4 DataFlowNodes in sequence', function (done) {
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
    node4.inject(node3).inject(node2).inject(node1);
  });

  it('should handle 5 DataFlowNodes in sequence', function (done) {
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
    node5.inject(node4).inject(node3).inject(node2).inject(node1);
  });

  it('should handle 6 DataFlowNodes in sequence', function (done) {
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
    node6.inject(node5).inject(node4).inject(node3).inject(node2).inject(node1);
  });

  it('View data can be seen even when we subscribe after injection', function (done) {
    var model = Cycle.createModel(function () {
      return {m$: Rx.Observable.just(2)};
    });
    var view = Cycle.createView(function (model) {
      return {
        vtree$: model.get('m$').map(function (x) { return Cycle.h('div', String(x)); }),
        v$: model.get('m$').map(function (x) { return x * 3; })
      };
    });
    var fakeUser = Cycle.createIntent(function (view) {
      return {i$: view.get('v$').map(function (x) { return x * 5; })};
    });
    fakeUser.inject(view).inject(model);
    view.get('vtree$').subscribe(function (x) {
      assert.strictEqual(x.type, 'VirtualNode');
      done();
    });
  });
});
