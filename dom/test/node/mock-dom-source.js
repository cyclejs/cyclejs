'use strict';
/* global describe, it */
let assert = require('assert');
let Rx = require('rx');
let CycleDOM = require('../../lib/index');
let mockDOMSource = CycleDOM.mockDOMSource;

describe('mockDOMSource', function () {
  it('should be in accessible in the API', function () {
    assert.strictEqual(typeof CycleDOM.mockDOMSource, 'function');
  });

  it('should make an Observable for clicks on `.foo`', function (done) {
    const userEvents = mockDOMSource({
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
    const userEvents = mockDOMSource({
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
    const userEvents = mockDOMSource({
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
    const userEvents = mockDOMSource({
      '.foo': {
        'click': Rx.Observable.just(135)
      }
    });
    let subscribeExecuted = false;
    userEvents.select('.impossible').events('scroll')
      .subscribe(assert.fail, assert.fail, done);
  });

  it('should return empty Observable for select().elements and none is defined', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': Rx.Observable.just(135)
      }
    });
    let subscribeExecuted = false;
    userEvents.select('.foo').elements
      .subscribe(assert.fail, assert.fail, done);
  });

  it('should return defined Observable for select().elements', function (done) {
    const mockedDOMSource = mockDOMSource({
      '.foo': {
        elements: Rx.Observable.just(135)
      }
    });
    mockedDOMSource.select('.foo').elements
      .subscribe(e => {
        assert.strictEqual(e, 135)
        done()
      });
  });

  it('should return defined Observable when chaining .select()', function (done) {
    const mockedDOMSource = mockDOMSource({
      '.bar': {
        '.foo': {
          '.baz': {
            elements: Rx.Observable.just(135)
          }
        }
      }
    });
    mockedDOMSource.select('.bar').select('.foo').select('.baz').elements
      .subscribe(e => {
        assert.strictEqual(e, 135);
        done();
      });
  });

  it('multiple .select()s should not throw when given empty mockedSelectors', () => {
    assert.doesNotThrow(() => {
      const DOM = mockDOMSource({})
      DOM.select('.something').select('.other').events('click')
    })
  })

  it('multiple .select()s should return empty observable if not defined', () => {
    const DOM = mockDOMSource({})
    const selector = DOM.select('.something').select('.other')
    assert.strictEqual(selector.events('click') instanceof Rx.Observable, true)
    assert.strictEqual(selector.elements instanceof Rx.Observable, true)
  })
});
