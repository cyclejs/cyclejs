'use strict';
/* global describe, it */
let assert = require('assert');
let {Rx} = require('@cycle/core');
let CycleDOM = require('../../src/cycle-dom');
let mockDOMResponse = require('../../src/mock-dom-response');

describe('mockDOMResponse', function () {
  it('should be in accessible in the API', function () {
    assert.strictEqual(typeof CycleDOM.mockDOMResponse, 'function');
  });

  it('should make an Observable for clicks on `.foo`', function (done) {
    const userEvents = mockDOMResponse({
      '.foo': {
        'click': Rx.Observable.just(135)
      }
    });
    userEvents.select('.foo').events('click').subscribe(ev => {
      assert.strictEqual(ev, 135);
      done();
    })
  });

  it('should make multiple user event Observables', function (done) {
    const userEvents = mockDOMResponse({
      '.foo': {
        'click': Rx.Observable.just(135)
      },
      '.bar': {
        'scroll': Rx.Observable.just(2)
      }
    });
    Rx.Observable.combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.bar').events('scroll'),
      (a, b) => a * b
    ).subscribe(ev => {
      assert.strictEqual(ev, 270);
      done();
    })
  });

  it('should make multiple user event Observables on the same selector', function (done) {
    const userEvents = mockDOMResponse({
      '.foo': {
        'click': Rx.Observable.just(135),
        'scroll': Rx.Observable.just(3)
      }
    });
    Rx.Observable.combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.foo').events('scroll'),
      (a, b) => a * b
    ).subscribe(ev => {
      assert.strictEqual(ev, 405);
      done();
    })
  });

  it('should return an empty Observable if query does not match', function (done) {
    const userEvents = mockDOMResponse({
      '.foo': {
        'click': Rx.Observable.just(135)
      }
    });
    let subscribeExecuted = false;
    userEvents.select('.impossible').events('scroll').subscribe(ev => {
      subscribeExecuted = true;
    });
    setTimeout(() => {
      assert.strictEqual(subscribeExecuted, false);
      done();
    }, 1000);
  });

  it('should return empty Observable for select().observable', function (done) {
    const userEvents = mockDOMResponse({
      '.foo': {
        'click': Rx.Observable.just(135)
      }
    });
    let subscribeExecuted = false;
    userEvents.select('.foo').observable.subscribe(ev => {
      subscribeExecuted = true;
    });
    setTimeout(() => {
      assert.strictEqual(subscribeExecuted, false);
      done();
    }, 1000);
  });
});
