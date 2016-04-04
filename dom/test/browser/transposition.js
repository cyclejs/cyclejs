'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/core');
let CycleDOM = require('../../lib/index');
let Fixture89 = require('./fixtures/issue-89');
let Rx = require('rx');
let {html} = require('snabbdom-jsx');
let {h, svg, div, input, p, span, h2, h3, h4, select, option, thunk, makeDOMDriver} = CycleDOM;

function createRenderTarget(id = null) {
  let element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

describe('DOM rendering with transposition', function () {
  it('should accept a view wrapping a VTree$ (#89)', function (done) {
    function app() {
      const number$ = Fixture89.makeModelNumber$();
      return {
        DOM: Fixture89.viewWithContainerFn(number$)
      };
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    sources.DOM.select('.myelementclass').observable.skip(1).first() // 1st
      .subscribe(function (elements) {
        const myelement = elements[0];
        assert.notStrictEqual(myelement, null);
        assert.strictEqual(myelement.tagName, 'H3');
        assert.strictEqual(myelement.textContent, '123');
      });
    sources.DOM.select('.myelementclass').observable.skip(2).first() // 2nd
      .subscribe(function (elements) {
        const myelement = elements[0];
        assert.notStrictEqual(myelement, null);
        assert.strictEqual(myelement.tagName, 'H3');
        assert.strictEqual(myelement.textContent, '456');
        sources.dispose();
        done();
      });
  });

  it('should accept a view with VTree$ as the root of VTree', function (done) {
    function app() {
      const number$ = Fixture89.makeModelNumber$();
      return {
        DOM: Fixture89.viewWithoutContainerFn(number$)
      };
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    sources.DOM.select('.myelementclass').observable.skip(1).first() // 1st
      .subscribe(function (elements) {
        const myelement = elements[0];
        assert.notStrictEqual(myelement, null);
        assert.strictEqual(myelement.tagName, 'H3');
        assert.strictEqual(myelement.textContent, '123');
      });
    sources.DOM.select('.myelementclass').observable.skip(2).first() // 1st
      .subscribe(function (elements) {
        const myelement = elements[0];
        assert.notStrictEqual(myelement, null);
        assert.strictEqual(myelement.tagName, 'H3');
        assert.strictEqual(myelement.textContent, '456');
        sources.dispose();
        done();
      });
  });

  it('should render a VTree with a child Observable<VTree>', function (done) {
    function app() {
      const child$ = Rx.Observable.just(
        h4('.child', {}, 'I am a kid')
      ).delay(80);
      return {
        DOM: Rx.Observable.just(div('.my-class', [
          p({}, 'Ordinary paragraph'),
          child$
        ]))
      };
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    sources.DOM.select(':root').observable.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.child');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'H4');
      assert.strictEqual(selectEl.textContent, 'I am a kid');
      sources.dispose();
      done();
    });
  });

  it('should render a VTree with a grandchild Observable<VTree>', function (done) {
    function app() {
      const grandchild$ = Rx.Observable.just(
          h4('.grandchild', {}, [
            'I am a baby'
          ])
        ).delay(20);
      const child$ = Rx.Observable.just(
          h3('.child', {}, [
            'I am a kid',
            grandchild$
          ])
        ).delay(80);
      return {
        DOM: Rx.Observable.just(div('.my-class', [
          p({}, 'Ordinary paragraph'),
          child$
        ]))
      };
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    sources.DOM.select(':root').observable.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.grandchild');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'H4');
      assert.strictEqual(selectEl.textContent, 'I am a baby');
      sources.dispose();
      done();
    });
  });

  it('should render a SVG VTree with a child Observable<VTree>', function (done) {
    function app() {
      const child$ = Rx.Observable.just(
        h('g', {
          attrs: {'class': 'child'}
        })
      ).delay(80);
      return {
        DOM: Rx.Observable.just(svg([
          h('g'),
          child$
        ]))
      };
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    sources.DOM.select(':root').observable.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.child');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'g');
      sources.dispose();
      done();
    });
  });

  it('should only be concerned with values from the most recent nested Observable', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(
          div([
            Rx.Observable.of(1).concat(Rx.Observable.of(2).delay(5)).map(outer =>
              Rx.Observable.of(1).concat(Rx.Observable.of(2).delay(10)).map(inner =>
                div('.target', outer+'/'+inner)
              )
            )
          ])
        )
      };
    };

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    const expected = Rx.Observable.from(['1/1','2/1','2/2'])

    sources.DOM.select('.target').observable
      .skip(1)
      .map(els => els[0].innerHTML)
      .sequenceEqual(expected)
      .subscribe((areSame) => {
        assert.strictEqual(areSame, true);
        sources.dispose();
        sinks.dispose();
        done();
      });
  });
});
