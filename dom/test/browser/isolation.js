'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/rxjs-run').default;
let CycleDOM = require('../../lib/index');
let Rx = require('rxjs');
let {h, svg, div, p, span, h2, h3, h4, hJSX, select, option, makeDOMDriver} = CycleDOM;

function createRenderTarget(id = null) {
  let element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

describe('isolateSource', function () {
  it('should have the same effect as DOM.select()', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div({isolate: '$$CYCLEDOM$$-foo'}, [
              h4('.bar', 'Correct')
            ])
          ])
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    // Make assertions
    isolatedDOMSource.select('.bar').elements.skip(1).take(1).subscribe(elements => {
      assert.strictEqual(elements.length, 1);
      const correctElement = elements[0];
      assert.notStrictEqual(correctElement, null);
      assert.notStrictEqual(typeof correctElement, 'undefined');
      assert.strictEqual(correctElement.tagName, 'H4');
      assert.strictEqual(correctElement.textContent, 'Correct');
      setTimeout(() => {
        dispose();
        done();
      })
    });
    dispose = run();
  });

  it('should return source also with isolateSource and isolateSink', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(h('h3.top-most'))
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    let dispose = run();
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'top-most');
    // Make assertions
    assert.strictEqual(typeof isolatedDOMSource.isolateSource, 'function');
    assert.strictEqual(typeof isolatedDOMSource.isolateSink, 'function');
    dispose();
    done();
  });
});

describe('isolateSink', function () {
  it('should add an isolate field to the vtree sink', function (done) {
    function app(sources) {
      const vtree$ = Rx.Observable.of(h3('.top-most'));
      return {
        DOM: sources.DOM.isolateSink(vtree$, 'foo'),
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    // Make assertions
    sinks.DOM.take(1).subscribe(function (vtree) {
      assert.strictEqual(vtree.sel, 'h3.top-most');
      assert.strictEqual(vtree.data.isolate, '$$CYCLEDOM$$-foo');
      setTimeout(() => {
        dispose();
        done();
      })
    });
    dispose = run()
  });


  it('should not redundantly repeat the scope className', function (done) {
    function app(sources) {
      const vtree1$ = Rx.Observable.of(span('.tab1', 'Hi'));
      const vtree2$ = Rx.Observable.of(span('.tab2', 'Hello'));
      const first$ = sources.DOM.isolateSink(vtree1$, '1');
      const second$ = sources.DOM.isolateSink(vtree2$, '2');
      const switched$ = Rx.Observable.concat(
        Rx.Observable.of(1).delay(50),
        Rx.Observable.of(2).delay(50),
        Rx.Observable.of(1).delay(50),
        Rx.Observable.of(2).delay(50),
        Rx.Observable.of(1).delay(50),
        Rx.Observable.of(2).delay(50)
      ).switchMap(i => i === 1 ? first$ : second$);
      return {
        DOM: switched$
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    let dispose;
    // Make assertions
    sinks.DOM.skip(2).subscribe(function (vtree) {
      assert.strictEqual(vtree.sel, 'span.tab1');
      assert.strictEqual(vtree.data.isolate, '$$CYCLEDOM$$-1');
      dispose();
      done();
    });
    dispose = run();
  });
});

describe('isolation', function () {
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
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    sources.DOM.select('.bar').elements.skip(1).take(1).subscribe(function (elements) {
      assert.strictEqual(Array.isArray(elements), true);
      assert.strictEqual(elements.length, 1);
      const correctElement = elements[0];
      assert.notStrictEqual(correctElement, null);
      assert.notStrictEqual(typeof correctElement, 'undefined');
      assert.strictEqual(correctElement.tagName, 'H2');
      assert.strictEqual(correctElement.textContent, 'Correct');
      done();
    });
    run()
  });

  it('should allow parent to DOM.select() in its own isolation island', function (done) {
    function app(sources) {
      const {isolateSource, isolateSink} = sources.DOM;
      const islandElement$ = isolateSource(sources.DOM, 'island')
        .select('.bar').elements;
      const islandVTree$ = isolateSink(
        Rx.Observable.of(div([h3('.bar', 'Correct')])), 'island'
      );
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            sources.DOM.isolateSink(Rx.Observable.of(
              div('.foo', [
                islandVTree$,
                h4('.bar', 'Wrong')
              ])
            ), 'ISOLATION'),
          ])
        ),
        island: islandElement$
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    sinks.island.skip(1).take(1).subscribe(function (elements) {
      assert.strictEqual(Array.isArray(elements), true);
      assert.strictEqual(elements.length, 1);
      const correctElement = elements[0];
      assert.notStrictEqual(correctElement, null);
      assert.notStrictEqual(typeof correctElement, 'undefined');
      assert.strictEqual(correctElement.tagName, 'H3');
      assert.strictEqual(correctElement.textContent, 'Correct');
      done();
    });
    run()
  });

  it('should isolate DOM.select between parent and (wrapper) child', function (done) {
    function Frame(sources) {
      const click$ = sources.DOM.select('.foo').events('click');
      const vtree$ = Rx.Observable.of(
        h4('.foo.frame', {style: {backgroundColor: 'lightblue'}}, [
          sources.content$
        ])
      );
      return {
        DOM: vtree$,
        click$
      };
    }

    function Monalisa(sources) {
      const {isolateSource, isolateSink} = sources.DOM;

      const islandDOMSource = isolateSource(sources.DOM, 'island');
      const click$ = islandDOMSource.select('.foo').events('click');
      const islandDOMSink$ = isolateSink(
        Rx.Observable.of(span('.foo.monalisa', 'Monalisa')),
        'island'
      );

      const frameDOMSource = isolateSource(sources.DOM, 'myFrame');
      const frame = Frame({ DOM: frameDOMSource, content$: islandDOMSink$ });
      const outerVTree$ = isolateSink(frame.DOM, 'myFrame');

      return {
        DOM: outerVTree$,
        frameClick: frame.click$,
        monalisaClick: click$
      };
    }

    const {sources, sinks, run} = Cycle(Monalisa, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });
    let dispose;

    const frameClick$ = sinks.frameClick.map(ev => ({
      type: ev.type,
      tagName: ev.target.tagName
    }));

    const monalisaClick$ = sinks.monalisaClick.map(ev => ({
      type: ev.type,
      tagName: ev.target.tagName
    }));

    // Stop the propagtion of the first click
    sinks.monalisaClick.first().subscribe(ev => ev.stopPropagation());

    // The frame should be notified about 2 clicks:
    //  1. the second click on monalisa (whose propagation has not stopped)
    //  2. the only click on the frame itself
    const expected = [
      {type: 'click', tagName: 'SPAN'},
      {type: 'click', tagName: 'H4'},
    ]
    frameClick$.take(2).subscribe(event => {
      let e = expected.shift()
      assert.strictEqual(event.type, e.type)
      assert.strictEqual(event.tagName, e.tagName);
      if (expected.length === 0) {
        dispose();
        done();
      }
    });

    // Monalisa should receive two clicks
    const otherExpected = [
      {type: 'click', tagName: 'SPAN'},
      {type: 'click', tagName: 'SPAN'},
    ]
    monalisaClick$.take(2).subscribe(event => {
      let e = otherExpected.shift();
      assert.strictEqual(event.type, e.type);
      assert.strictEqual(event.tagName, e.tagName);
    });

    sources.DOM.select(':root').elements.skip(1).take(1).subscribe(root => {
      const frameFoo = root.querySelector('.foo.frame');
      const monalisaFoo = root.querySelector('.foo.monalisa');
      assert.notStrictEqual(frameFoo, null);
      assert.notStrictEqual(monalisaFoo, null);
      assert.notStrictEqual(typeof frameFoo, 'undefined');
      assert.notStrictEqual(typeof monalisaFoo, 'undefined');
      assert.strictEqual(frameFoo.tagName, 'H4');
      assert.strictEqual(monalisaFoo.tagName, 'SPAN');
      assert.doesNotThrow(() => {
        setTimeout(() => monalisaFoo.click());
        setTimeout(() => monalisaFoo.click());
        setTimeout(() => frameFoo.click(), 0);
      });
    });
    dispose = run();
  });

  it('should allow a child component to DOM.select() its own root', function (done) {
    function app(sources) {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            sources.DOM.isolateSink(Rx.Observable.of(
              span('.foo', [
                h4('.bar', 'Wrong')
              ])
            ), 'ISOLATION')
          ])
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    const {isolateSource} = sources.DOM;
    let dispose;
    isolateSource(sources.DOM, 'ISOLATION')
      .select('.foo').elements
      .skip(1).take(1)
      .subscribe(function (elements) {
        assert.strictEqual(Array.isArray(elements), true);
        assert.strictEqual(elements.length, 1);
        const correctElement = elements[0];
        assert.notStrictEqual(correctElement, null);
        assert.notStrictEqual(typeof correctElement, 'undefined');
        assert.strictEqual(correctElement.tagName, 'SPAN');
        setTimeout(() => {
          dispose();
          done();
        })
      });
    dispose = run();
  });

  it('should allow DOM.selecting svg elements', function (done) {
    function App(sources) {
      const triangleElement$ = sources.DOM.select('.triangle').elements;

      const svgTriangle = svg({width: 150, height: 150}, [
        svg.polygon({
          attrs: {
            class: 'triangle',
            points: '20 0 20 150 150 20'
          }
        }),
      ]);

      return {
        DOM: Rx.Observable.of(svgTriangle),
        triangleElement: triangleElement$
      };
    }

    function IsolatedApp(sources) {
      const {isolateSource, isolateSink} = sources.DOM
      const isolatedDOMSource = isolateSource(sources.DOM, 'ISOLATION');
      const app = App({DOM: isolatedDOMSource});
      const isolateDOMSink = isolateSink(app.DOM, 'ISOLATION');
      return {
        DOM: isolateDOMSink,
        triangleElement: app.triangleElement
      };
    }

    const {sinks, sources, run} = Cycle(IsolatedApp, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    // Make assertions
    const selection = sinks.triangleElement.skip(1).take(1).subscribe(elements => {
      assert.strictEqual(elements.length, 1);
      const triangleElement = elements[0];
      assert.notStrictEqual(triangleElement, null);
      assert.notStrictEqual(typeof triangleElement, 'undefined');
      assert.strictEqual(triangleElement.tagName, 'polygon');
      done();
    });
    run();
  });

  it('should allow DOM.select()ing its own root without classname or id', function(done) {
    function app(sources) {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            sources.DOM.isolateSink(Rx.Observable.of(
              span([
                h4('.bar', 'Wrong')
              ])
            ), 'ISOLATION')
          ])
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    const {isolateSource} = sources.DOM;

    isolateSource(sources.DOM, 'ISOLATION')
      .select('span').elements
      .skip(1).take(1)
      .subscribe(function (elements) {
        assert.strictEqual(Array.isArray(elements), true);
        assert.strictEqual(elements.length, 1);
        const correctElement = elements[0];
        assert.notStrictEqual(correctElement, null);
        assert.notStrictEqual(typeof correctElement, 'undefined');
        assert.strictEqual(correctElement.tagName, 'SPAN');
        done();
      });

    run();
  });

  it('should allow DOM.select()ing all elements with `*`', function(done) {
    function app(sources) {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            sources.DOM.isolateSink(Rx.Observable.of(
              span([
                div([
                  h4('.foo', 'hello'),
                  h4('.bar', 'world')
                ])
              ])
            ), 'ISOLATION')
          ])
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget(), {transposition: true})
    });

    const {isolateSource} = sources.DOM;

    isolateSource(sources.DOM, 'ISOLATION')
      .select('*').elements
      .skip(1).take(1)
      .subscribe(function (elements) {
        assert.strictEqual(Array.isArray(elements), true);
        assert.strictEqual(elements.length, 4);
        done();
      });

    run();
  });

  it('should select() isolated element with tag + class', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div({isolate: '$$CYCLEDOM$$-foo'}, [
              h4('.bar', 'Correct')
            ])
          ])
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    // Make assertions
    isolatedDOMSource.select('h4.bar').elements.skip(1).take(1).subscribe(elements => {
      assert.strictEqual(elements.length, 1);
      const correctElement = elements[0];
      assert.notStrictEqual(correctElement, null);
      assert.notStrictEqual(typeof correctElement, 'undefined');
      assert.strictEqual(correctElement.tagName, 'H4');
      assert.strictEqual(correctElement.textContent, 'Correct');
      done();
    });
    run();
  });

  it('should process bubbling events from inner to outer component', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div({isolate: '$$CYCLEDOM$$-foo'}, [
              h4('.bar', 'Correct')
            ])
          ])
        )
      };
    }

    const {sinks, sources, run} = Cycle(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    let called = false

    sources.DOM.select('.top-most').events('click').subscribe(ev => {
      assert.strictEqual(called, true)
      done()
    })

    isolatedDOMSource.select('h4.bar').events('click').subscribe(ev => {
      assert.strictEqual(called, false)
      called = true
    })

    // Make assertions
    isolatedDOMSource.select('h4.bar').elements.skip(1).take(1).subscribe(elements => {
      assert.strictEqual(elements.length, 1);
      const correctElement = elements[0];
      assert.notStrictEqual(correctElement, null);
      assert.notStrictEqual(typeof correctElement, 'undefined');
      assert.strictEqual(correctElement.tagName, 'H4');
      assert.strictEqual(correctElement.textContent, 'Correct');
      correctElement.click();
    });
    run();
  });
});
