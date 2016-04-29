'use strict';
/* global describe, it */
let assert = require('assert');
let xs = require('xstream').default;
let {Stream} = require('xstream');
let CycleDOM = require('../../lib/index');
let mockDOMSource = CycleDOM.mockDOMSource;

describe('mockDOMSource', function () {
  it('should be in accessible in the API', function () {
    assert.strictEqual(typeof CycleDOM.mockDOMSource, 'function');
  });

  it('should make an Observable for clicks on `.foo`', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': xs.of(135)
      }
    });
    userEvents.select('.foo').events('click').addListener({
      next: ev => {
        assert.strictEqual(ev, 135);
        done();
      },
      error: err => done(err),
      complete: () => {},
    })
  });

  it('should make multiple user event Observables', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': xs.of(135)
      },
      '.bar': {
        'scroll': xs.of(2)
      }
    });
    xs.combine(
      (a, b) => a * b,
      userEvents.select('.foo').events('click'),
      userEvents.select('.bar').events('scroll')
    ).addListener({
      next: ev => {
        assert.strictEqual(ev, 270);
        done();
      },
      error: err => done(err),
      complete: () => {},
    })
  });

  it('should make multiple user event Observables on the same selector', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': xs.of(135),
        'scroll': xs.of(3)
      }
    });
    xs.combine(
      (a, b) => a * b,
      userEvents.select('.foo').events('click'),
      userEvents.select('.foo').events('scroll')
    ).addListener({
      next: ev => {
        assert.strictEqual(ev, 405);
        done();
      },
      error: err => done(err),
      complete: () => {},
    });
  });

  it('should return an empty Observable if query does not match', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': xs.of(135)
      }
    });
    let subscribeExecuted = false;
    userEvents.select('.impossible').events('scroll')
      .addListener({next: assert.fail, error: assert.fail, complete: done});
  });

  it('should return empty Observable for select().elements and none is defined', function (done) {
    const userEvents = mockDOMSource({
      '.foo': {
        'click': xs.of(135)
      }
    });
    let subscribeExecuted = false;
    userEvents.select('.foo').elements
      .addListener({next: assert.fail, error: assert.fail, complete: done});
  });

  it('should return defined Observable for select().elements', function (done) {
    const mockedDOMSource = mockDOMSource({
      '.foo': {
        elements: xs.of(135)
      }
    });
    mockedDOMSource.select('.foo').elements
      .addListener({
        next: e => {
          assert.strictEqual(e, 135)
          done()
        },
        error: err => done(err),
        complete: () => {},
      });
  });

  it('should return defined Observable when chaining .select()', function (done) {
    const mockedDOMSource = mockDOMSource({
      '.bar': {
        '.foo': {
          '.baz': {
            elements: xs.of(135)
          }
        }
      }
    });
    mockedDOMSource.select('.bar').select('.foo').select('.baz').elements
      .addListener({
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
      const DOM = mockDOMSource({})
      DOM.select('.something').select('.other').events('click')
    })
  })

  it('multiple .select()s should return empty observable if not defined', () => {
    const DOM = mockDOMSource({})
    const selector = DOM.select('.something').select('.other')
    assert.strictEqual(selector.events('click') instanceof Stream, true)
    assert.strictEqual(selector.elements instanceof Stream, true)
  })
});
