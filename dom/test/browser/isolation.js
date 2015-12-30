'use strict';
/* global describe, it, beforeEach */
let assert = require('assert');
let Cycle = require('@cycle/core');
let CycleDOM = require('../../src/cycle-dom');
let Rx = require('rx');
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
        DOM: Rx.Observable.just(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.cycle-scope-foo', [
              h4('.bar', 'Correct')
            ])
          ])
        )
      };
    }
    let {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    let isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    // Make assertions
    isolatedDOMSource.select('.bar').observable.skip(1).take(1).subscribe(elements => {
      assert.strictEqual(elements.length, 1);
      const correctElement = elements[0];
      assert.notStrictEqual(correctElement, null);
      assert.notStrictEqual(typeof correctElement, 'undefined');
      assert.strictEqual(correctElement.tagName, 'H4');
      assert.strictEqual(correctElement.textContent, 'Correct');
      sources.dispose();
      done();
    });
  });

  it('should return source also with isolateSource and isolateSink', function (done) {
    function app() {
      return {
        DOM: Rx.Observable.just(h('h3.top-most'))
      };
    }
    let {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    let isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'top-most');
    // Make assertions
    assert.strictEqual(typeof isolatedDOMSource.isolateSource, 'function');
    assert.strictEqual(typeof isolatedDOMSource.isolateSink, 'function');
    sources.dispose();
    done();
  });
});

describe('isolateSink', function () {
  it('should add a className to the vtree sink', function (done) {
    function app(sources) {
      let vtree$ = Rx.Observable.just(h3('.top-most'));
      return {
        DOM: sources.DOM.isolateSink(vtree$, 'foo'),
      };
    }
    let {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    // Make assertions
    sources.DOM.select(':root').observable.skip(1).take(1)
      .subscribe(function (root) {
        let element = root.querySelector('.top-most');
        assert.notStrictEqual(element, null);
        assert.notStrictEqual(typeof element, 'undefined');
        assert.strictEqual(element.tagName, 'H3');
        assert.strictEqual(element.className, 'top-most cycle-scope-foo');
        sources.dispose();
        done();
      });
  });

  it('should add a className to a vtree sink that had no className', function (done) {
    function app(sources) {
      let vtree$ = Rx.Observable.just(h3());
      return {
        DOM: sources.DOM.isolateSink(vtree$, 'foo'),
      };
    }
    let {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    // Make assertions
    sources.DOM.select(':root').observable.skip(1).take(1)
      .subscribe(function (root) {
        let element = root.querySelector('h3');
        assert.notStrictEqual(element, null);
        assert.notStrictEqual(typeof element, 'undefined');
        assert.strictEqual(element.tagName, 'H3');
        assert.strictEqual(element.className, 'cycle-scope-foo');
        sources.dispose();
        done();
      });
  });

  it('should not redundantly repeat the scope className', function (done) {
    function app(sources) {
      let vtree1$ = Rx.Observable.just(span({className: 'tab1'}, 'Hi'));
      let vtree2$ = Rx.Observable.just(span({className: 'tab2'}, 'Hello'));
      let first$ = sources.DOM.isolateSink(vtree1$, '1');
      let second$ = sources.DOM.isolateSink(vtree2$, '2');
      let switched$ = Rx.Observable.concat(
        Rx.Observable.just(1).delay(50),
        Rx.Observable.just(2).delay(50),
        Rx.Observable.just(1).delay(50),
        Rx.Observable.just(2).delay(50),
        Rx.Observable.just(1).delay(50),
        Rx.Observable.just(2).delay(50)
      ).flatMapLatest(i => i === 1 ? first$ : second$);
      return {
        DOM: switched$
      };
    }
    let {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    // Make assertions
    sources.DOM.select(':root').observable.skip(5).take(1)
      .subscribe(function (root) {
        let element = root.querySelector('span');
        assert.notStrictEqual(element, null);
        assert.notStrictEqual(typeof element, 'undefined');
        assert.strictEqual(element.tagName, 'SPAN');
        assert.strictEqual(element.className, 'tab1 cycle-scope-1');
        sources.dispose();
        done();
      });
  });
});

describe('isolation', function () {
  it('should prevent parent from DOM.selecting() inside the isolation', function (done) {
    function app(sources) {
      return {
        DOM: Rx.Observable.just(
          h3('.top-most', [
            sources.DOM.isolateSink(Rx.Observable.just(
              div('.foo', [
                h4('.bar', 'Wrong')
              ])
            ), 'ISOLATION'),
            h2('.bar', 'Correct'),
          ])
        )
      };
    }
    let {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    sources.DOM.select('.bar').observable.skip(1).take(1).subscribe(function (elements) {
      assert.strictEqual(Array.isArray(elements), true);
      assert.strictEqual(elements.length, 1);
      const correctElement = elements[0];
      assert.notStrictEqual(correctElement, null);
      assert.notStrictEqual(typeof correctElement, 'undefined');
      assert.strictEqual(correctElement.tagName, 'H2');
      assert.strictEqual(correctElement.textContent, 'Correct');
      done();
    });
  });

  it('should allow parent to DOM.select() in its own isolation island', function (done) {
    function app(sources) {
      const {isolateSource, isolateSink} = sources.DOM;
      const islandElement$ = isolateSource(sources.DOM, 'island')
        .select('.bar').observable;
      const islandVTree$ = isolateSink(
        Rx.Observable.just(div([h3('.bar', 'Correct')])), 'island'
      );
      return {
        DOM: Rx.Observable.just(
          h3('.top-most', [
            sources.DOM.isolateSink(Rx.Observable.just(
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
    let {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
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
  });

  it('should isolate DOM.select between parent and (wrapper) child', function (done) {
    function Frame(sources) {
      const click$ = sources.DOM.select('.foo').events('click');
      const vtree$ = Rx.Observable.just(
        h4('.foo.frame', [ sources.content$ ])
      );
      return {
        DOM: vtree$,
        click$
      };
    }

    function Monalisa(sources) {
      const {isolateSource, isolateSink} = sources.DOM;

      const islandDOMSource = isolateSource(sources.DOM, 'island');
      const click$ = islandDOMSource.select('.foo')
        .events('click').do(e => e.stopPropagation());
      const islandDOMSink$ = isolateSink(
        Rx.Observable.just(span('.foo.monalisa', 'Correct')),
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

    const {sources, sinks} = Cycle.run(Monalisa, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    let monalisaFoo;
    let frameFoo;

    sinks.frameClick.subscribe(ev => {
      assert.strictEqual(ev.type, 'click');
      assert.strictEqual(ev.target.tagName, 'H4');
      assert.doesNotThrow(function () {
        monalisaFoo.click();
      });
    });
    sinks.monalisaClick.subscribe(ev => {
      assert.strictEqual(ev.type, 'click');
      assert.strictEqual(ev.target.tagName, 'SPAN');
      sources.dispose();
      done();
    });

    sources.DOM.select(':root').observable.skip(1).take(1).subscribe(root => {
      frameFoo = root.querySelector('.foo.frame');
      monalisaFoo = root.querySelector('.foo.monalisa');
      assert.notStrictEqual(frameFoo, null);
      assert.notStrictEqual(monalisaFoo, null);
      assert.notStrictEqual(typeof frameFoo, 'undefined');
      assert.notStrictEqual(typeof monalisaFoo, 'undefined');
      assert.strictEqual(frameFoo.tagName, 'H4');
      assert.strictEqual(monalisaFoo.tagName, 'SPAN');
      assert.doesNotThrow(function () {
        frameFoo.click();
      });
    });
  });

  it('should allow a child component to DOM.select() its own root', function (done) {
    function app(sources) {
      return {
        DOM: Rx.Observable.just(
          h3('.top-most', [
            sources.DOM.isolateSink(Rx.Observable.just(
              span('.foo', [
                h4('.bar', 'Wrong')
              ])
            ), 'ISOLATION')
          ])
        )
      };
    }
    let {sinks, sources} = Cycle.run(app, {
      DOM: makeDOMDriver(createRenderTarget())
    });
    const {isolateSource} = sources.DOM;
    isolateSource(sources.DOM, 'ISOLATION')
      .select('.foo').observable
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
  });

  it('should allow DOM.selecting svg elements', function (done) {
    function App(sources) {
      const triangleElement$ = sources.DOM.select('.triangle').observable;

      let svgTriangle = svg('svg', {width: 150, height: 150}, [
        svg('polygon', {
          class: 'triangle',
          attributes: {
            points: '20 0 20 150 150 20'
          }
        }),
      ]);

      return {
        DOM: Rx.Observable.just(svgTriangle),
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

    let {sinks, sources} = Cycle.run(IsolatedApp, {
      DOM: makeDOMDriver(createRenderTarget())
    });

    // Make assertions
    const selection = sinks.triangleElement.skip(1).take(1).subscribe(elements => {
      assert.strictEqual(elements.length, 1);
      let triangleElement = elements[0];
      assert.notStrictEqual(triangleElement, null);
      assert.notStrictEqual(typeof triangleElement, 'undefined');
      assert.strictEqual(triangleElement.tagName, 'polygon');
      done();
    });
  });
});
