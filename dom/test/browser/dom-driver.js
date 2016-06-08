'use strict';
/* global describe, it */
let assert = require('assert');
let Cycle = require('@cycle/rxjs-run').default;
let CycleDOM = require('../../lib/index');
let Fixture89 = require('./fixtures/issue-89');
let Rx = require('rxjs');
let {h, svg, div, input, p, span, h2, h3, h4, select, option, makeDOMDriver} = CycleDOM;

function createRenderTarget(id = null) {
  let element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

describe('makeDOMDriver', function () {
  it('should accept a DOM element as input', function () {
    const element = createRenderTarget();
    assert.doesNotThrow(function () {
      makeDOMDriver(element);
    });
  });

  it('should accept a DocumentFragment as input', function () {
    const element = document.createDocumentFragment();
    assert.doesNotThrow(function () {
      makeDOMDriver(element);
    });
  });

  it('should accept a string selector to an existing element as input', function () {
    const id = 'testShouldAcceptSelectorToExisting';
    const element = createRenderTarget();
    element.id = id;
    assert.doesNotThrow(function () {
      makeDOMDriver('#' + id);
    });
  });

  it('should not accept a selector to an unknown element as input', function () {
    assert.throws(function () {
      makeDOMDriver('#nonsenseIdToNothing');
    }, /Cannot render into unknown element/);
  });

  it('should not accept a number as input', function () {
    assert.throws(function () {
      makeDOMDriver(123);
    }, /Given container is not a DOM element neither a selector string/);
  });

  it('should have a streamAdapter property', function () {
    const element = createRenderTarget();
    const DOMDriver = makeDOMDriver(element);
    assert.notStrictEqual(typeof DOMDriver.streamAdapter, 'undefined');
    assert.strictEqual(typeof DOMDriver.streamAdapter.adapt, 'function');
    assert.strictEqual(typeof DOMDriver.streamAdapter.makeSubject, 'function');
    assert.strictEqual(typeof DOMDriver.streamAdapter.remember, 'function');
    assert.strictEqual(typeof DOMDriver.streamAdapter.isValidStream, 'function');
    assert.strictEqual(typeof DOMDriver.streamAdapter.streamSubscribe, 'function');
  });
});

describe('DOM Driver', function () {
  it('should throw if input is not an Observable<VTree>', function () {
    const domDriver = makeDOMDriver(createRenderTarget());
    assert.throws(function () {
      domDriver({});
    }, /The DOM driver function expects as input a Stream of virtual/);
  });

  it('should have isolateSource() and isolateSink() in source', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(div())
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    let dispose = run();
    assert.strictEqual(typeof sources.DOM.isolateSource, 'function');
    assert.strictEqual(typeof sources.DOM.isolateSink, 'function');
    dispose();
    done();
  });

  it('should not work after has been disposed', function (done) {
    const number$ = Rx.Observable.range(1, 3)
      .concatMap(x => Rx.Observable.of(x).delay(50));

    function app() {
      return {
        DOM: number$.map(number =>
            h3('.target', String(number))
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    sources.DOM.select(':root').elements().skip(1).subscribe(function (root) {
      const selectEl = root.querySelector('.target');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'H3');
      assert.notStrictEqual(selectEl.textContent, '3');
      if (selectEl.textContent === '2') {
        dispose();
        setTimeout(() => {
          done();
        }, 100);
      }
    });
    dispose = run();
  });
});
