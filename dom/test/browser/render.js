'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/rxjs-run').default;
let CycleDOM = require('../../lib/index');
let Rx = require('rxjs');
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
  it('should render DOM elements even when DOMSource is not utilized', function (done) {
    function main() {
      return {
        DOM: Rx.Observable.of(
          div('.my-render-only-container', [
            h2('Cycle.js framework')
          ])
        )
      };
    }

    Cycle.run(main, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    setTimeout(() => {
      const myContainer = document.querySelector('.my-render-only-container');
      assert.notStrictEqual(myContainer, null);
      assert.notStrictEqual(typeof myContainer, 'undefined');
      assert.strictEqual(myContainer.tagName, 'DIV');
      const header = myContainer.querySelector('h2');
      assert.notStrictEqual(header, null);
      assert.notStrictEqual(typeof header, 'undefined');
      assert.strictEqual(header.textContent, 'Cycle.js framework');
      done();
    }, 150);
  });

  it('should convert a simple virtual-dom <select> to DOM element', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(select('.my-class', [
          option({value: 'foo'}, 'Foo'),
          option({value: 'bar'}, 'Bar'),
          option({value: 'baz'}, 'Baz')
        ]))
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    sources.DOM.select(':root').elements().skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      setTimeout(() => {
        dispose();
        done();
      });
    });
    dispose = run();
  });

  it('should convert a simple virtual-dom <select> (JSX) to DOM element', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(
          <select className="my-class">
            <option value="foo">Foo</option>
            <option value="bar">Bar</option>
            <option value="baz">Baz</option>
          </select>
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    sources.DOM.select(':root').elements().skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('.my-class');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'SELECT');
      setTimeout(() => {
        dispose();
        done();
      })
    });
    dispose = run();
  });

  it('should give elements as a value-over-time', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(h2('.value-over-time', 'Hello test'))
          .merge(Rx.Observable.never())
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    let firstSubscriberRan = false;
    let secondSubscriberRan = false;

    const element$ = sources.DOM.select(':root').elements();

    element$.skip(1).subscribe(function (root) {
      assert.strictEqual(firstSubscriberRan, false);
      firstSubscriberRan = true;
      const header = root.querySelector('.value-over-time');
      assert.notStrictEqual(header, null);
      assert.notStrictEqual(typeof header, 'undefined');
      assert.strictEqual(header.tagName, 'H2');
    });

    setTimeout(() => {
      element$.subscribe(function (root) {
        assert.strictEqual(secondSubscriberRan, false);
        secondSubscriberRan = true;
        const header = root.querySelector('.value-over-time');
        assert.notStrictEqual(header, null);
        assert.notStrictEqual(typeof header, 'undefined');
        assert.strictEqual(header.tagName, 'H2');
        setTimeout(() => {
          dispose();
          done();
        });
      });
    }, 100);
    dispose = run();
  });

  it('should have DevTools flag in elements source stream', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(h2('.value-over-time', 'Hello test'))
          .merge(Rx.Observable.never())
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    const element$ = sources.DOM.select(':root').elements();
    assert.strictEqual(element$._isCycleSource, 'DOM');
    done();
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
            thunk('h4', 'key1', renderThunk, ['hello' + 0])
          ])
        )
      };
    }

    // Run it
    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    // Assert it
    sources.DOM.select(':root').elements().skip(1).take(1).subscribe(function (root) {
      const selectEl = root.querySelector('h4');
      assert.notStrictEqual(selectEl, null);
      assert.notStrictEqual(typeof selectEl, 'undefined');
      assert.strictEqual(selectEl.tagName, 'H4');
      assert.strictEqual(selectEl.textContent, 'Constantly hello0');
      dispose();
      done();
    });
    dispose = run();
  });

  it('should render embedded HTML within SVG <foreignObject>', function (done) {
    const thisBrowserSupportsForeignObject = document.implementation
      .hasFeature('www.http://w3.org/TR/SVG11/feature#Extensibility', '1.1');

    if (!thisBrowserSupportsForeignObject) {
      done();
    } else {
      function app() {
        return {
          DOM: Rx.Observable.of(
            svg({ attrs: { width: 150, height: 50 }}, [
              svg.foreignObject({ attrs: { width: '100%', height: '100%' }}, [
                p('.embedded-text', 'This is HTML embedded in SVG')
              ])
            ])
          )
        }
      }

      // Run it
      const {sinks, sources, run} = Cycle(app, {
        DOM: makeDOMDriver(createRenderTarget())
      });

      let dispose;

      // Make assertions
      sources.DOM.select(':root').elements().skip(1).take(1).subscribe(function (root) {
        const embeddedHTML = root.querySelector('p.embedded-text');

        assert.strictEqual(embeddedHTML.namespaceURI, 'http://www.w3.org/1999/xhtml');
        assert.notStrictEqual(embeddedHTML.clientWidth, 0);
        assert.notStrictEqual(embeddedHTML.clientHeight, 0);

        setTimeout(() => {
          dispose();
          done();
        });
      });

      dispose = run();
    }
  });

  it('should filter out null/undefined children', function (done) {
    // The Cycle.js app
    function app() {
      return {
        DOM: Rx.Observable.interval(10).take(5).map(i =>
          div('.parent', [
            'Child 1',
            null,
            h4('.child3', [
              null,
              'Grandchild 31',
              div('.grandchild32', [
                null,
                'Great grandchild 322'
              ])
            ]),
            undefined
          ])
        )
      };
    }

    // Run it
    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    // Assert it
    sources.DOM.select(':root').elements().skip(1).take(1).subscribe(function (root) {
      assert.strictEqual(root.querySelector('div.parent').childNodes.length, 2);
      assert.strictEqual(root.querySelector('h4.child3').childNodes.length, 2);
      assert.strictEqual(root.querySelector('div.grandchild32').childNodes.length, 1);
      dispose();
      done();
    });
    dispose = run();
  });

  it('should render textContent "0" given hyperscript content value number 0', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(div('.my-class', 0))
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    sources.DOM.select(':root').elements().skip(1).take(1).subscribe(function (root) {
      const divEl = root.querySelector('.my-class');
      assert.strictEqual(divEl.textContent, '0');
      setTimeout(() => {
        dispose();
        done();
      });
    });
    dispose = run();
  });
});
