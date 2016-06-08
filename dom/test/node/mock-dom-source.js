'use strict';
/* global describe, it */
let assert = require('assert');
let CycleDOM = require('../../lib/index');
let {Observable} = require('rxjs');
let RxJSAdapter = require('@cycle/rxjs-adapter').default;
let mockDOMSource = CycleDOM.mockDOMSource;

describe('mockDOMSource', function () {
  it('should be in accessible in the API', function () {
    assert.strictEqual(typeof CycleDOM.mockDOMSource, 'function');
  });

  it('should make an Observable for clicks on `.foo`', function (done) {
    const userEvents = mockDOMSource(RxJSAdapter, {
      '.foo': {
        'click': Observable.of(135)
      }
    });
    userEvents.select('.foo').events('click').subscribe({
      next: ev => {
        assert.strictEqual(ev, 135);
        done();
      },
      error: err => done(err),
      complete: () => {},
    });
  });

  it('should make multiple user event Observables', function (done) {
    const userEvents = mockDOMSource(RxJSAdapter, {
      '.foo': {
        'click': Observable.of(135)
      },
      '.bar': {
        'scroll': Observable.of(2)
      }
    });
    Observable.combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.bar').events('scroll'),
      (a, b) => a * b
    ).subscribe({
      next: ev => {
        assert.strictEqual(ev, 270);
        done();
      },
      error: err => done(err),
      complete: () => {},
    })
  });

  it('should make multiple user event Observables on the same selector', function (done) {
    const userEvents = mockDOMSource(RxJSAdapter, {
      '.foo': {
        'click': Observable.of(135),
        'scroll': Observable.of(3)
      }
    });
    Observable.combineLatest(
      userEvents.select('.foo').events('click'),
      userEvents.select('.foo').events('scroll'),
      (a, b) => a * b
    ).subscribe({
      next: ev => {
        assert.strictEqual(ev, 405);
        done();
      },
      error: err => done(err),
      complete: () => {},
    });
  });

  it('should return an empty Observable if query does not match', function (done) {
    const userEvents = mockDOMSource(RxJSAdapter, {
      '.foo': {
        'click': Observable.of(135)
      }
    });
    userEvents.select('.impossible').events('scroll')
      .subscribe({next: assert.fail, error: assert.fail, complete: done});
  });

  it('should return empty Observable for select().elements and none is defined', function (done) {
    const userEvents = mockDOMSource(RxJSAdapter, {
      '.foo': {
        'click': Observable.of(135)
      }
    });
    userEvents.select('.foo').elements()
      .subscribe({next: assert.fail, error: assert.fail, complete: done});
  });

  it('should return defined Observable for select().elements', function (done) {
    const mockedDOMSource = mockDOMSource(RxJSAdapter, {
      '.foo': {
        elements: Observable.of(135)
      }
    });
    mockedDOMSource.select('.foo').elements()
      .subscribe({
        next: e => {
          assert.strictEqual(e, 135)
          done()
        },
        error: err => done(err),
        complete: () => {},
      });
  });

  it('should return defined Observable when chaining .select()', function (done) {
    const mockedDOMSource = mockDOMSource(RxJSAdapter, {
      '.bar': {
        '.foo': {
          '.baz': {
            elements: Observable.of(135)
          }
        }
      }
    });
    mockedDOMSource.select('.bar').select('.foo').select('.baz').elements()
      .subscribe({
        next: e => {
          assert.strictEqual(e, 135)
          done()
        },
        error: err => done(err),
        complete: () => {},
      });
  });

  it('multiple .select()s should not throw when given empty mockedSelectors', () => {
    assert.doesNotThrow(() => {
      const DOM = mockDOMSource(RxJSAdapter, {})
      DOM.select('.something').select('.other').events('click')
    })
  })

  it('multiple .select()s should return some observable if not defined', () => {
    const DOM = mockDOMSource(RxJSAdapter, {})
    const domSource = DOM.select('.something').select('.other')
    assert.strictEqual(RxJSAdapter.isValidStream(domSource.events('click')), true,
      'domSource.events(click) should be an Observable instance');
    assert.strictEqual(RxJSAdapter.isValidStream(domSource.elements()), true,
      'domSource.elements() should be an Observable instance');
  })
});
