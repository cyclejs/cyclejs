'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/core');
let CycleDOM = require('../../lib/index');
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

describe('DOM Rendering', function () {
  it('should convert a simple virtual-dom <select> to DOM element', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.just(select('.my-class', [
          option({value: 'foo'}, 'Foo'),
          option({value: 'bar'}, 'Bar'),
          option({value: 'baz'}, 'Baz')
        ]))
      };
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    sources.DOM.select(':root').observable.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      sources.dispose();
      done();
    });
  });

  it('should convert a simple virtual-dom <select> (JSX) to DOM element', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.just(
          <select className="my-class">
            <option value="foo">Foo</option>
            <option value="bar">Bar</option>
            <option value="baz">Baz</option>
          </select>
        )
      };
    }

    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    sources.DOM.select(':root').observable.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      sources.dispose();
      done();
    });
  });

  it('should allow snabbdom Thunks in the VTree', function (done) {
    function renderThunk(greeting) {
      return h4('Constantly ' + greeting)
    }

    // The Cycle.js app
    function app() {
      return {
        DOM: Rx.Observable.interval(10).take(5).map(i =>
          div([
            thunk('thunk', renderThunk, 'hello' + 0)
          ])
        )
      };
    }

    // Run it
    const {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    // Assert it
    sources.DOM.select(':root').observable.skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('h4');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'H4');
      assert.strictEqual(selectEl.textContent, 'Constantly hello0');
      sources.dispose();
      done();
    });
  });
});
