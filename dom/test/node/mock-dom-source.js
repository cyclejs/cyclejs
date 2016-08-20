'use strict';
/* global describe, it */
let assert = require('assert');
let CycleDOM = require('../../lib/index');
let {Observable} = require('rxjs');
let Cycle = require('@cycle/rxjs-run').default;
let Rx = require('rxjs');
let RxJSAdapter = require('@cycle/rxjs-adapter').default;
let mockDOMSource = CycleDOM.mockDOMSource;
let {h4, h3, h2, div, h} = CycleDOM;

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

  it('should have DevTools flag in elements() source stream', function (done) {
    const mockedDOMSource = mockDOMSource(RxJSAdapter, {
      '.foo': {
        elements: Observable.of(135)
      }
    });
    assert.strictEqual(mockedDOMSource.select('.foo').elements()._isCycleSource, 'MockedDOM');
    done();
  });

  it('should have DevTools flag in events() source stream', function (done) {
    const userEvents = mockDOMSource(RxJSAdapter, {
      '.foo': {
        'click': Observable.of(135)
      }
    });
    assert.strictEqual(userEvents.select('.foo').events('click')._isCycleSource, 'MockedDOM');
    done();
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

describe('isolation on MockedDOMSource', function () {
  it('should have the same effect as DOM.select()', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.child.___foo', [
              h4('.bar', 'Correct')
            ])
          ])
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: () => mockDOMSource(RxJSAdapter, {
        '.___foo': {
          '.bar': {
            elements: Observable.of('skipped', 135)
          }
        }
      })
    });

    let dispose;
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    // Make assertions
    isolatedDOMSource.select('.bar').elements().skip(1).take(1).subscribe(elements => {
      assert.strictEqual(elements, 135);
      setTimeout(() => {
        dispose();
        done();
      })
    });
    dispose = run();
  });

  it('should have isolateSource and isolateSink', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(h('h3.top-most.___foo'))
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: () => mockDOMSource(RxJSAdapter, {})
    });
    let dispose = run();
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');
    // Make assertions
    assert.strictEqual(typeof isolatedDOMSource.isolateSource, 'function');
    assert.strictEqual(typeof isolatedDOMSource.isolateSink, 'function');
    dispose();
    done();
  });

  it('should prevent parent from DOM.selecting() inside the isolation', function (done) {
    function app(sources) {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            sources.DOM.isolateSink(Rx.Observable.of(
              div('.foo', [
                h4('.bar', 'Wrong')
              ])
            ), 'ISOLATION'),
            h2('.bar', 'Correct'),
          ])
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: () => mockDOMSource(RxJSAdapter, {
        '.___ISOLATION': {
          '.bar': {
            elements: Rx.Observable.of('skipped', 'Wrong'),
          },
        },
        '.bar': {
          elements: Rx.Observable.of('skipped', 'Correct'),
        },
      })
    });

    sources.DOM.select('.bar').elements().skip(1).take(1).subscribe(function (x) {
      assert.strictEqual(x, 'Correct');
      done();
    });
    run()
  });
});
