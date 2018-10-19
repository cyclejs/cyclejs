import * as assert from 'assert';
import isolate from '@cycle/isolate';
import xs, {Stream, MemoryStream} from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';
import delay from 'xstream/extra/delay';
import concat from 'xstream/extra/concat';
import {setup} from '@cycle/run';
import {
  h,
  svg,
  div,
  span,
  h2,
  h3,
  h4,
  button,
  makeDOMDriver,
  DOMSource,
  MainDOMSource,
  VNode,
  thunk,
} from '../../src/index';

function createRenderTarget(id: string | null = null) {
  const element = document.createElement('div');
  element.className = 'cycletest';
  if (id) {
    element.id = id;
  }
  document.body.appendChild(element);
  return element;
}

describe('isolateSource', function() {
  it('should return source also with isolateSource and isolateSink', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(h('h3.top-most')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    const dispose = run();
    const isolatedDOMSource = sources.DOM.isolateSource(
      sources.DOM,
      'top-most'
    );
    // Make assertions
    assert.strictEqual(typeof isolatedDOMSource.isolateSource, 'function');
    assert.strictEqual(typeof isolatedDOMSource.isolateSink, 'function');
    dispose();
    done();
  });
});

describe('isolateSink', function() {
  it('should add an isolate field to the vtree sink', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const vtree$ = xs.of(h3('.top-most'));
      return {
        DOM: _sources.DOM.isolateSink(vtree$, 'foo'),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    // Make assertions
    sinks.DOM.take(1).addListener({
      next: (vtree: VNode) => {
        assert.strictEqual(vtree.sel, 'h3.top-most');
        assert.strictEqual(Array.isArray((vtree.data as any).isolate), true);
        assert.deepStrictEqual((vtree.data as any).isolate, [
          {type: 'total', scope: 'foo'},
        ]);
        setTimeout(() => {
          dispose();
          done();
        });
      },
    });
    dispose = run();
  });

  it('should not redundantly repeat the scope className', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const vtree1$ = xs.of(span('.tab1', 'Hi'));
      const vtree2$ = xs.of(span('.tab2', 'Hello'));
      const first$ = _sources.DOM.isolateSink(vtree1$, '1');
      const second$ = _sources.DOM.isolateSink(vtree2$, '2');
      const switched$ = concat(
        xs.of(1).compose(delay(50)),
        xs.of(2).compose(delay(50)),
        xs.of(1).compose(delay(50)),
        xs.of(2).compose(delay(50)),
        xs.of(1).compose(delay(50)),
        xs.of(2).compose(delay(50))
      )
        .map(i => (i === 1 ? first$ : second$))
        .flatten();
      return {
        DOM: switched$,
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    // Make assertions
    sinks.DOM.drop(2)
      .take(1)
      .addListener({
        next: (vtree: VNode) => {
          assert.strictEqual(vtree.sel, 'span.tab1');
          assert.strictEqual(Array.isArray((vtree.data as any).isolate), true);
          assert.strictEqual((vtree.data as any).isolate.length, 1);
          assert.deepStrictEqual((vtree.data as any).isolate, [
            {type: 'total', scope: '1'},
          ]);
          dispose();
          done();
        },
      });
    dispose = run();
  });
});

describe('isolation', function() {
  it('should prevent parent from DOM.selecting() inside the isolation', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const child$ = _sources.DOM.isolateSink(
        xs.of(div('.foo', [h4('.bar', 'Wrong')])),
        'ISOLATION'
      );

      const vdom$ = xs
        .combine(xs.of(null), child$)
        .map(([_, child]) => h3('.top-most', [child, h2('.bar', 'Correct')]));

      return {
        DOM: vdom$,
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.bar')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0];
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'H2');
          assert.strictEqual(correctElement.textContent, 'Correct');
          done();
        },
      });
    run();
  });

  it('should not occur with scope ":root"', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const child$ = _sources.DOM.isolateSink(
        xs.of(div('.foo', [h4('.bar', 'Not wrong')])),
        ':root'
      );

      const vdom$ = xs
        .combine(xs.of(null), child$)
        .map(([_, child]) => h3('.top-most', [child, h2('.bar', 'Correct')]));

      return {
        DOM: vdom$,
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.bar')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 2);

          const notWrongElement = elements[0];
          assert.notStrictEqual(notWrongElement, null);
          assert.notStrictEqual(typeof notWrongElement, 'undefined');
          assert.strictEqual(notWrongElement.tagName, 'H4');
          assert.strictEqual(notWrongElement.textContent, 'Not wrong');

          const correctElement = elements[1];
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'H2');
          assert.strictEqual(correctElement.textContent, 'Correct');
          done();
        },
      });
    run();
  });

  it('should apply only between siblings when given scope ".foo"', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const foo$ = _sources.DOM.isolateSink(
        xs.of(div('.container', [h4('.header', 'Correct')])),
        '.foo'
      );

      const bar$ = _sources.DOM.isolateSink(
        xs.of(div('.container', [h3('.header', 'Wrong')])),
        '.bar'
      );

      const vdom$ = xs
        .combine(foo$, bar$)
        .map(([foo, bar]) =>
          div('.top-most', [foo, bar, h2('.header', 'Correct')])
        );

      return {
        DOM: vdom$,
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    // Assert parent has total access to its children
    sources.DOM.select('.header')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 3);
          assert.strictEqual(elements[0].tagName, 'H4');
          assert.strictEqual(elements[0].textContent, 'Correct');
          assert.strictEqual(elements[1].tagName, 'H3');
          assert.strictEqual(elements[1].textContent, 'Wrong');
          assert.strictEqual(elements[2].tagName, 'H2');
          assert.strictEqual(elements[2].textContent, 'Correct');

          // Assert .foo child has no access to .bar child
          sources.DOM.isolateSource(sources.DOM, '.foo')
            .select('.header')
            .elements()
            .take(1)
            .addListener({
              next: (els: Array<Element>) => {
                assert.strictEqual(Array.isArray(els), true);
                assert.strictEqual(els.length, 1);
                assert.strictEqual(els[0].tagName, 'H4');
                assert.strictEqual(els[0].textContent, 'Correct');
                done();
              },
            });
        },
      });

    run();
  });

  it('should apply only between siblings when given scope "#foo"', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const foo$ = _sources.DOM.isolateSink(
        xs.of(div('.container', [h4('.header', 'Correct')])),
        '#foo'
      );

      const bar$ = _sources.DOM.isolateSink(
        xs.of(div('.container', [h3('.header', 'Wrong')])),
        '#bar'
      );

      const vdom$ = xs
        .combine(foo$, bar$)
        .map(([foo, bar]) =>
          div('.top-most', [foo, bar, h2('.header', 'Correct')])
        );

      return {
        DOM: vdom$,
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    // Assert parent has total access to its children
    sources.DOM.select('.header')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 3);
          assert.strictEqual(elements[0].tagName, 'H4');
          assert.strictEqual(elements[0].textContent, 'Correct');
          assert.strictEqual(elements[1].tagName, 'H3');
          assert.strictEqual(elements[1].textContent, 'Wrong');
          assert.strictEqual(elements[2].tagName, 'H2');
          assert.strictEqual(elements[2].textContent, 'Correct');

          // Assert .foo child has no access to .bar child
          sources.DOM.isolateSource(sources.DOM, '#foo')
            .select('.header')
            .elements()
            .take(1)
            .addListener({
              next: (els: Array<Element>) => {
                assert.strictEqual(Array.isArray(els), true);
                assert.strictEqual(els.length, 1);
                assert.strictEqual(els[0].tagName, 'H4');
                assert.strictEqual(els[0].textContent, 'Correct');
                done();
              },
            });
        },
      });

    run();
  });

  it('should work with thunks', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const child$ = _sources.DOM.isolateSink(
        xs.of(thunk('div.foo', () => div('.foo', [h4('.bar', 'Wrong')]), [])),
        'ISOLATION'
      );

      const vdom$ = xs
        .combine(xs.of(null), child$)
        .map(([_, child]) => h3('.top-most', [child, h2('.bar', 'Correct')]));

      return {
        DOM: vdom$,
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select('.bar')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0];
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'H2');
          assert.strictEqual(correctElement.textContent, 'Correct');
          done();
        },
      });
    run();
  });

  it('should allow using elements() in an isolated main() fn', function(done) {
    function main(_sources: {DOM: MainDOMSource}) {
      const elem$ = _sources.DOM.select(':root').elements();
      const vnode$ = elem$.map(elem =>
        h('div.bar', 'left=' + (elem[0] as any).offsetLeft)
      );
      return {
        DOM: vnode$,
      };
    }

    const {sinks, sources, run} = setup(isolate(main), {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const barElem = root.querySelector('.bar') as Element;
          assert.notStrictEqual(barElem, null);
          assert.notStrictEqual(typeof barElem, 'undefined');
          assert.strictEqual(barElem.tagName, 'DIV');
          assert.strictEqual(barElem.textContent, 'left=8');
          done();
        },
      });
    run();
  });

  it('should allow parent to DOM.select() in its own isolation island', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const {isolateSource, isolateSink} = _sources.DOM;
      const islandElement$ = isolateSource(_sources.DOM, 'island')
        .select('.bar')
        .elements();
      const islandVDom$ = isolateSink(
        xs.of(div([h3('.bar', 'Correct')])),
        'island'
      );
      const child$ = isolateSink(
        islandVDom$.map(islandVDom =>
          div('.foo', [islandVDom, h4('.bar', 'Wrong')])
        ),
        'ISOLATION'
      );
      const vdom$ = child$.map(child => h3('.top-most', [child]));

      return {
        DOM: vdom$,
        island: islandElement$,
      };
    }

    const drivers = {
      DOM: makeDOMDriver(createRenderTarget()),
      island(sink: Stream<Array<Element>>) {},
    };
    const {sinks, sources, run} = setup(app, drivers);

    sinks.island
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0];
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'H3');
          assert.strictEqual(correctElement.textContent, 'Correct');
          done();
        },
      });
    run();
  });

  it('should isolate DOM.select between parent and (wrapper) child', function(done) {
    function Frame(_sources: {DOM: MainDOMSource; content$: Stream<any>}) {
      const click$ = _sources.DOM.select('.foo').events('click');
      const vdom$ = _sources.content$.map(content =>
        h4('.foo.frame', {style: {backgroundColor: 'lightblue'}}, [content])
      );
      return {
        DOM: vdom$,
        click$,
      };
    }

    function Monalisa(_sources: {DOM: MainDOMSource}): any {
      const {isolateSource, isolateSink} = _sources.DOM;

      const islandDOMSource = isolateSource(_sources.DOM, '.island');
      const monalisaClick$ = islandDOMSource.select('.foo').events('click');
      const islandDOMSink$ = isolateSink(
        xs.of(span('.foo.monalisa', 'Monalisa')),
        '.island'
      );

      const click$ = _sources.DOM.select('.foo').events('click');

      const frameDOMSource = isolateSource(_sources.DOM, 'myFrame');
      const frame = Frame({DOM: frameDOMSource, content$: islandDOMSink$});
      const outerVTree$ = isolateSink(frame.DOM, 'myFrame');

      return {
        DOM: outerVTree$,
        frameClick: frame.click$,
        monalisaClick: monalisaClick$,
        click: click$,
      };
    }

    const {sources, sinks, run} = setup(Monalisa, {
      DOM: makeDOMDriver(createRenderTarget()),
      frameClick: () => {},
      monalisaClick: () => {},
      click: () => {},
    });
    let dispose: any;

    const frameClick$ = sinks.frameClick.map((ev: any) => ({
      type: ev.type,
      tagName: (ev.target as HTMLElement).tagName,
    }));

    const _monalisaClick$ = sinks.monalisaClick.map((ev: any) => ({
      type: ev.type,
      tagName: (ev.target as HTMLElement).tagName,
    }));

    const grandparentClick$ = sinks.click.map((ev: any) => ({
      type: ev.type,
      tagName: (ev.target as HTMLElement).tagName,
    }));

    // Stop the propagtion of the second click
    sinks.monalisaClick
      .drop(1)
      .take(1)
      .addListener({
        next: (ev: Event) => ev.stopPropagation(),
      });

    let totalClickHandlersCalled = 0;
    let frameClicked = false;
    frameClick$.addListener({
      next: (event: any) => {
        assert.strictEqual(frameClicked, false);
        assert.strictEqual(event.type, 'click');
        assert.strictEqual(event.tagName, 'H4');
        frameClicked = true;
        totalClickHandlersCalled++;
      },
    });

    // Monalisa should receive two clicks
    let monalisaClicked = 0;
    _monalisaClick$.addListener({
      next: (event: any) => {
        assert.strictEqual(monalisaClicked < 2, true);
        assert.strictEqual(event.type, 'click');
        assert.strictEqual(event.tagName, 'SPAN');
        monalisaClicked++;
        totalClickHandlersCalled++;
      },
    });

    // The grandparent should receive sibling isolated events
    // from the monalisa even though it is passed into the
    // total isolated Frame
    let grandparentClicked = false;
    grandparentClick$.addListener({
      next: (event: any) => {
        assert.strictEqual(event.type, 'click');
        assert.strictEqual(event.tagName, 'SPAN');
        assert.strictEqual(grandparentClicked, false);
        grandparentClicked = true;
        totalClickHandlersCalled++;
        assert.doesNotThrow(() => {
          setTimeout(() => {
            assert.strictEqual(totalClickHandlersCalled, 4);
            dispose();
            done();
          }, 10);
        });
      },
    });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const frameFoo = root.querySelector('.foo.frame') as HTMLElement;
          const monalisaFoo = root.querySelector(
            '.foo.monalisa'
          ) as HTMLElement;
          assert.notStrictEqual(frameFoo, null);
          assert.notStrictEqual(monalisaFoo, null);
          assert.notStrictEqual(typeof frameFoo, 'undefined');
          assert.notStrictEqual(typeof monalisaFoo, 'undefined');
          assert.strictEqual(frameFoo.tagName, 'H4');
          assert.strictEqual(monalisaFoo.tagName, 'SPAN');
          assert.doesNotThrow(() => {
            setTimeout(() => frameFoo.click(), 0);
            setTimeout(() => monalisaFoo.click());
            setTimeout(() => monalisaFoo.click());
          });
        },
      });
    dispose = run();
  });

  it('should allow a child component to DOM.select() its own root', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const child$ = _sources.DOM.isolateSink(
        xs.of(span('.foo', [h4('.bar', 'Wrong')])),
        'ISOLATION'
      );

      return {
        DOM: child$.map(child => h3('.top-most', [child])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const {isolateSource} = sources.DOM;
    let dispose: any;
    isolateSource(sources.DOM, 'ISOLATION')
      .select('.foo')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0];
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'SPAN');
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
  });

  it('should allow DOM.selecting svg elements', function(done) {
    function App(_sources: {DOM: MainDOMSource}) {
      const triangleElement$ = _sources.DOM.select('.triangle').elements();

      const svgTriangle = svg({attrs: {width: 150, height: 150}}, [
        svg.polygon({
          attrs: {
            class: 'triangle',
            points: '20 0 20 150 150 20',
          },
        }),
      ]);

      return {
        DOM: xs.of(svgTriangle),
        triangleElement: triangleElement$,
      };
    }

    function IsolatedApp(_sources: {DOM: MainDOMSource}) {
      const {isolateSource, isolateSink} = _sources.DOM;
      const isolatedDOMSource = isolateSource(_sources.DOM, 'ISOLATION');
      const app = App({DOM: isolatedDOMSource});
      const isolateDOMSink = isolateSink(app.DOM, 'ISOLATION');
      return {
        DOM: isolateDOMSink,
        triangleElement: app.triangleElement,
      };
    }

    const drivers = {
      DOM: makeDOMDriver(createRenderTarget()),
      triangleElement: (sink: any) => {},
    };
    const {sinks, sources, run} = setup(IsolatedApp, drivers);

    // Make assertions
    sinks.triangleElement
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(elements.length, 1);
          const triangleElement = elements[0];
          assert.notStrictEqual(triangleElement, null);
          assert.notStrictEqual(typeof triangleElement, 'undefined');
          assert.strictEqual(triangleElement.tagName, 'polygon');
          done();
        },
      });
    run();
  });

  it('should allow DOM.select()ing its own root without classname or id', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const child$ = _sources.DOM.isolateSink(
        xs.of(span([h4('.bar', 'Wrong')])),
        'ISOLATION'
      );

      return {
        DOM: child$.map(child => h3('.top-most', [child])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const {isolateSource} = sources.DOM;

    isolateSource(sources.DOM, 'ISOLATION')
      .select('span')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0];
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'SPAN');
          done();
        },
      });

    run();
  });

  it('should allow DOM.select()ing all elements with `*`', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      const child$ = _sources.DOM.isolateSink(
        xs.of(span([div([h4('.foo', 'hello'), h4('.bar', 'world')])])),
        'ISOLATION'
      );

      return {
        DOM: child$.map(child => h3('.top-most', [child])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const {isolateSource} = sources.DOM;

    isolateSource(sources.DOM, 'ISOLATION')
      .select('*')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 4);
          done();
        },
      });
    run();
  });

  it('should select() isolated element with tag + class', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div({isolate: [{type: 'total', scope: 'foo'}]}, [
              h4('.bar', 'Correct'),
            ]),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    isolatedDOMSource
      .select('h4.bar')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0];
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'H4');
          assert.strictEqual(correctElement.textContent, 'Correct');
          done();
        },
      });
    run();
  });

  it('should allow isolatedDOMSource.events() to work without crashing', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(
          h3('.top-most', [
            div({isolate: [{type: 'total', scope: 'foo'}]}, [
              h4('.bar', 'Hello'),
            ]),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    let dispose: any;
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    isolatedDOMSource.events('click').addListener({
      next: (ev: Event) => {
        dispose();
        done();
      },
    });

    isolatedDOMSource
      .select('div')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0] as HTMLElement;
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'DIV');
          assert.strictEqual(correctElement.textContent, 'Hello');
          setTimeout(() => {
            correctElement.click();
          });
        },
      });
    dispose = run();
  });

  it('should process bubbling events from inner to outer component', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div({isolate: [{type: 'sibling', scope: '.foo'}]}, [
              h4('.bar', 'Correct'),
            ]),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    let dispose: any;
    const isolatedDOMSource = sources.DOM.isolateSource(sources.DOM, '.foo');

    let called = false;

    sources.DOM.select('.top-most')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(called, true);
          dispose();
          done();
        },
      });

    isolatedDOMSource
      .select('h4.bar')
      .events('click')
      .addListener({
        next: (ev: Event) => {
          assert.strictEqual(called, false);
          called = true;
        },
      });

    isolatedDOMSource
      .select('h4.bar')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0] as HTMLElement;
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'H4');
          assert.strictEqual(correctElement.textContent, 'Correct');
          setTimeout(() => {
            correctElement.click();
          });
        },
      });
    dispose = run();
  });

  it('should stop bubbling the event if the currentTarget was removed', function(done) {
    function main(_sources: {DOM: MainDOMSource}) {
      const childExistence$ = _sources.DOM.isolateSource(_sources.DOM, 'foo')
        .select('h4.bar')
        .events('click')
        .map(() => false)
        .startWith(true);

      return {
        DOM: childExistence$.map(exists =>
          div([
            div('.top-most', {isolate: 'top'}, [
              h2('.bar', 'Wrong'),
              exists
                ? div({isolate: [{type: 'total', scope: 'foo'}]}, [
                    h4('.bar', 'Correct'),
                  ])
                : null,
            ]),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    let dispose: any;
    const topDOMSource = sources.DOM.isolateSource(sources.DOM, 'top');
    const fooDOMSource = sources.DOM.isolateSource(sources.DOM, 'foo');

    let parentEventHandlerCalled = false;

    topDOMSource
      .select('.bar')
      .events('click')
      .addListener({
        next: (ev: any) => {
          parentEventHandlerCalled = true;
          done('this should not be called');
        },
      });

    fooDOMSource
      .select('.bar')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(elements.length, 1);
          const correctElement = elements[0] as HTMLElement;
          assert.notStrictEqual(correctElement, null);
          assert.notStrictEqual(typeof correctElement, 'undefined');
          assert.strictEqual(correctElement.tagName, 'H4');
          assert.strictEqual(correctElement.textContent, 'Correct');
          setTimeout(() => {
            correctElement.click();
            setTimeout(() => {
              assert.strictEqual(parentEventHandlerCalled, false);
              dispose();
              done();
            }, 150);
          });
        },
      });
    dispose = run();
  });

  it('should handle a higher-order graph when events() are subscribed', done => {
    let errorHappened = false;
    let clickDetected = false;

    function Child(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: _sources.DOM.select('.foo')
          .events('click')
          .debug(() => {
            clickDetected = true;
          })
          .replaceError(() => {
            errorHappened = true;
            return xs.empty();
          })
          .mapTo(1)
          .startWith(0)
          .map(num => div('.container', [h3('.foo', 'Child foo')])),
      };
    }

    function main(_sources: {DOM: MainDOMSource}) {
      const first = isolate(Child, 'first')(_sources);
      const second = isolate(Child, 'second')(_sources);
      const oneChild = [first];
      const twoChildren = [first, second];
      const vnode$ = xs
        .periodic(50)
        .take(1)
        .startWith(-1)
        .map(i => (i === -1 ? oneChild : twoChildren))
        .map(children =>
          xs
            .combine(...children.map(child => child.DOM))
            .map(childVNodes => div('.parent', childVNodes))
        )
        .flatten();
      return {
        DOM: vnode$,
      };
    }

    const {sinks, sources, run} = setup(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select(':root')
      .element()
      .drop(2)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const parentEl = root.querySelector('.parent') as HTMLElement;
          const foo = parentEl.querySelectorAll('.foo')[1] as HTMLElement;
          assert.notStrictEqual(parentEl, null);
          assert.notStrictEqual(typeof parentEl, 'undefined');
          assert.notStrictEqual(foo, null);
          assert.notStrictEqual(typeof foo, 'undefined');
          assert.strictEqual(parentEl.tagName, 'DIV');
          setTimeout(() => {
            assert.strictEqual(errorHappened, false);
            foo.click();
            setTimeout(() => {
              assert.strictEqual(clickDetected, true);
              dispose();
              done();
            }, 50);
          }, 100);
        },
      });
    dispose = run();
  });

  it('should handle events when child is removed and re-added', done => {
    let clicksCount = 0;

    function Child(_sources: {DOM: MainDOMSource}) {
      _sources.DOM.select('.foo')
        .events('click')
        .addListener({
          next: () => {
            clicksCount++;
          },
        });
      return {
        DOM: xs.of(div('.foo', ['This is foo'])),
      };
    }

    function main(_sources: {DOM: MainDOMSource}) {
      const child = isolate(Child)(_sources);
      // make child.DOM be inserted, removed, and inserted again
      const innerDOM$ = xs
        .periodic(120)
        .take(2)
        .map(x => x + 1)
        .startWith(0)
        .map(x => (x === 1 ? xs.of(div()) : child.DOM))
        .flatten();
      return {
        DOM: innerDOM$,
      };
    }

    const {sinks, sources, run} = setup(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(3)
      .addListener({
        next: (root: Element) => {
          setTimeout(() => {
            const foo = root.querySelector('.foo');
            if (!foo) {
              return;
            }
            (foo as any).click();
          }, 0);
        },
      });
    setTimeout(() => {
      assert.strictEqual(clicksCount, 2);
      dispose();
      done();
    }, 500);
    dispose = run();
  });

  it('should handle events when parent is removed and re-added', done => {
    let clicksCount = 0;

    function Child(_sources: {DOM: MainDOMSource}) {
      _sources.DOM.select('.foo')
        .events('click')
        .addListener({
          next: () => {
            clicksCount++;
          },
        });
      return {
        DOM: xs.of(div('.foo', ['This is foo'])),
      };
    }

    function main(_sources: {DOM: MainDOMSource}) {
      const child = isolate(Child, 'child')(_sources);
      // change parent key, causing it to be recreated
      const x$ = xs
        .periodic(120)
        .map(x => x + 1)
        .startWith(0)
        .take(4);
      const innerDOM$ = xs
        .combine<number, VNode>(x$, child.DOM)
        .map(([x, childVDOM]) =>
          div(`.parent${x}`, {key: `key${x}`}, [childVDOM, `${x}`])
        );
      return {
        DOM: innerDOM$,
      };
    }

    const {sinks, sources, run} = setup(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(4)
      .addListener({
        next: (root: Element) => {
          setTimeout(() => {
            const foo = root.querySelector('.foo');
            if (!foo) {
              return;
            }
            (foo as any).click();
          }, 0);
        },
      });
    setTimeout(() => {
      assert.strictEqual(clicksCount, 4);
      dispose();
      done();
    }, 800);
    dispose = run();
  });

  it('should handle events when parent is removed and re-added, and has isolation scope', done => {
    let clicksCount = 0;

    function Child(_sources: {DOM: MainDOMSource}) {
      _sources.DOM.select('.foo')
        .events('click')
        .addListener({
          next: () => {
            clicksCount++;
          },
        });
      return {
        DOM: xs.of(div('.foo', ['This is foo'])),
      };
    }

    function Parent(_sources: {DOM: MainDOMSource}) {
      const child = isolate(Child, 'child')(_sources);
      // change parent key, causing it to be recreated
      const x$ = xs
        .periodic(120)
        .map(x => x + 1)
        .startWith(0)
        .take(4);
      const innerDOM$ = xs
        .combine<number, VNode>(x$, child.DOM)
        .map(([x, childVDOM]) =>
          div(`.parent${x}`, {key: `key${x}`}, [childVDOM, `${x}`])
        );
      return {
        DOM: innerDOM$,
      };
    }

    function main(_sources: {DOM: MainDOMSource}) {
      const parent = isolate(Parent, 'parent')(_sources);
      return {
        DOM: parent.DOM,
      };
    }

    const {sinks, sources, run} = setup(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(4)
      .addListener({
        next: (root: Element) => {
          setTimeout(() => {
            const foo = root.querySelector('.foo');
            if (!foo) {
              return;
            }
            (foo as any).click();
          }, 0);
        },
      });
    setTimeout(() => {
      assert.strictEqual(clicksCount, 4);
      dispose();
      done();
    }, 800);
    dispose = run();
  });

  it(
    'should allow an isolated child to receive events when it is used as ' +
      'the vTree of an isolated parent component',
    done => {
      let dispose: any;
      function Component(_sources: {DOM: MainDOMSource}) {
        _sources.DOM.select('.btn')
          .events('click')
          .addListener({
            next: (ev: Event) => {
              assert.strictEqual((ev.target as HTMLElement).tagName, 'BUTTON');
              dispose();
              done();
            },
          });
        return {
          DOM: xs.of(div('.component', {}, [button('.btn', {}, 'Hello')])),
        };
      }

      function main(_sources: {DOM: MainDOMSource}) {
        const component = isolate(Component)(_sources);
        return {DOM: component.DOM};
      }

      function app(_sources: {DOM: MainDOMSource}) {
        return isolate(main)(_sources);
      }

      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const element = root.querySelector('.btn') as HTMLElement;
            assert.notStrictEqual(element, null);
            setTimeout(() => element.click());
          },
        });

      dispose = run();
    }
  );

  it(
    'should allow an sibling isolated child to receive events when it is used as ' +
      'the vTree of an isolated parent component',
    done => {
      let dispose: any;
      function Component(_sources: {DOM: MainDOMSource}) {
        _sources.DOM.select('.btn')
          .events('click')
          .addListener({
            next: (ev: Event) => {
              assert.strictEqual((ev.target as HTMLElement).tagName, 'BUTTON');
              dispose();
              done();
            },
          });
        return {
          DOM: xs.of(
            div(
              '.component',
              {
                props: {className: 'mydiv'},
              },
              [button('.btn', {}, 'Hello')]
            )
          ),
        };
      }

      function main(_sources: {DOM: MainDOMSource}) {
        const component = isolate(Component, '.foo')(_sources);
        return {DOM: component.DOM};
      }

      function app(_sources: {DOM: MainDOMSource}) {
        return isolate(main)(_sources);
      }

      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const element = root.querySelector('.btn') as HTMLElement;
            assert.notStrictEqual(element, null);
            setTimeout(() => element.click());
          },
        });

      dispose = run();
    }
  );

  it(
    'should allow an isolated child to receive events when it is used as ' +
      'the vTree of an isolated parent component when scope is explicitly ' +
      'specified on child',
    done => {
      let dispose: any;
      function Component(_sources: {DOM: MainDOMSource}) {
        _sources.DOM.select('.btn')
          .events('click')
          .addListener({
            next: (ev: Event) => {
              assert.strictEqual((ev.target as HTMLElement).tagName, 'BUTTON');
              dispose();
              done();
            },
          });
        return {
          DOM: xs.of(div('.component', {}, [button('.btn', {}, 'Hello')])),
        };
      }

      function main(_sources: {DOM: MainDOMSource}) {
        const component = isolate(Component, 'foo')(_sources);
        return {DOM: component.DOM};
      }

      function app(_sources: {DOM: MainDOMSource}) {
        return isolate(main)(_sources);
      }

      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const element = root.querySelector('.btn') as HTMLElement;
            assert.notStrictEqual(element, null);
            setTimeout(() => element.click());
          },
        });

      dispose = run();
    }
  );

  it(
    'should allow an isolated child to receive events when it is used as ' +
      'the vTree of an isolated parent component when scope is explicitly ' +
      'specified on parent',
    done => {
      let dispose: any;
      function Component(_sources: {DOM: MainDOMSource}) {
        _sources.DOM.select('.btn')
          .events('click')
          .addListener({
            next: (ev: Event) => {
              assert.strictEqual((ev.target as HTMLElement).tagName, 'BUTTON');
              dispose();
              done();
            },
          });
        return {
          DOM: xs.of(div('.component', {}, [button('.btn', {}, 'Hello')])),
        };
      }

      function main(_sources: {DOM: MainDOMSource}) {
        const component = isolate(Component)(_sources);
        return {DOM: component.DOM};
      }

      function app(_sources: {DOM: MainDOMSource}) {
        return isolate(main, 'foo')(_sources);
      }

      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const element = root.querySelector('.btn') as HTMLElement;
            assert.notStrictEqual(element, null);
            setTimeout(() => element.click());
          },
        });

      dispose = run();
    }
  );

  it(
    'should allow an isolated child to receive events when it is used as ' +
      'the vTree of an isolated parent component when scope is explicitly ' +
      'specified on parent and child',
    done => {
      let dispose: any;
      function Component(_sources: {DOM: MainDOMSource}) {
        _sources.DOM.select('.btn')
          .events('click')
          .addListener({
            next: (ev: Event) => {
              assert.strictEqual((ev.target as HTMLElement).tagName, 'BUTTON');
              dispose();
              done();
            },
          });
        return {
          DOM: xs.of(div('.component', {}, [button('.btn', {}, 'Hello')])),
        };
      }

      function main(_sources: {DOM: MainDOMSource}) {
        const component = isolate(Component, 'bar')(_sources);
        return {DOM: component.DOM};
      }

      function app(_sources: {DOM: MainDOMSource}) {
        return isolate(main, 'foo')(_sources);
      }

      const {sinks, sources, run} = setup(app, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      sources.DOM.element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const element = root.querySelector('.btn') as HTMLElement;
            assert.notStrictEqual(element, null);
            setTimeout(() => element.click());
          },
        });

      dispose = run();
    }
  );

  it(
    'should maintain virtual DOM list sanity using keys, in a list of ' +
      'isolated components',
    done => {
      const componentRemove$ = xs.create<any>();

      function Component(_sources: {DOM: MainDOMSource}) {
        _sources.DOM.select('.btn')
          .events('click')
          .addListener({
            next: (ev: Event) => {
              componentRemove$.shamefullySendNext(null);
            },
          });

        return {
          DOM: xs.of(div('.component', {}, [button('.btn', {}, 'Hello')])),
        };
      }

      function main(_sources: {DOM: MainDOMSource}) {
        const remove$ = componentRemove$
          .compose(delay(50))
          .fold(acc => acc + 1, 0);
        const first = isolate(Component, 'first')(_sources);
        const second = isolate(Component, 'second')(_sources);
        const vdom$ = xs
          .combine(first.DOM, second.DOM, remove$)
          .map(([vdom1, vdom2, r]) => {
            if (r === 0) {
              return div([vdom1, vdom2]);
            } else if (r === 1) {
              return div([vdom2]);
            } else if (r === 2) {
              return div([]);
            } else {
              done('This case must not happen.');
              return div();
            }
          });
        return {DOM: vdom$};
      }

      const {sinks, sources, run} = setup(main, {
        DOM: makeDOMDriver(createRenderTarget()),
      });

      let dispose: any;
      sources.DOM.element()
        .drop(1)
        .take(1)
        .addListener({
          next: (root: Element) => {
            const components = root.querySelectorAll('.btn');
            assert.strictEqual(components.length, 2);
            const firstElement = components[0] as HTMLElement;
            const secondElement = components[1] as HTMLElement;
            setTimeout(() => {
              firstElement.click();
            }, 100);
            setTimeout(() => {
              secondElement.click();
            }, 300);
            setTimeout(() => {
              assert.strictEqual(root.querySelectorAll('.component').length, 0);
              dispose();
              done();
            }, 500);
          },
        });
      dispose = run();
    }
  );

  it('should allow null or undefined isolated child DOM', function(done) {
    function child(_sources: {DOM: MainDOMSource}) {
      const visible$ = xs
        .periodic(50)
        .take(1)
        .fold((acc, _) => !acc, true);
      const vdom$ = visible$.map(visible => (visible ? h4('child') : null));
      return {
        DOM: vdom$,
      };
    }

    function main(_sources: {DOM: MainDOMSource}) {
      const childSinks = isolate(child, 'child')(_sources);
      const vdom$ = childSinks.DOM.map((childVDom: VNode) =>
        div('.parent', [childVDom, h2('part of parent')])
      );
      return {
        DOM: vdom$,
      };
    }

    const {sinks, sources, run} = setup(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const parentEl = root.querySelector('.parent') as Element;
          assert.strictEqual(parentEl.childNodes.length, 2);
          assert.strictEqual(parentEl.children[0].tagName, 'H4');
          assert.strictEqual(parentEl.children[0].textContent, 'child');
          assert.strictEqual(parentEl.children[1].tagName, 'H2');
          assert.strictEqual(
            parentEl.children[1].textContent,
            'part of parent'
          );
        },
      });
    sources.DOM.element()
      .drop(2)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const parentEl = root.querySelector('.parent') as Element;
          assert.strictEqual(parentEl.childNodes.length, 1);
          assert.strictEqual(parentEl.children[0].tagName, 'H2');
          assert.strictEqual(
            parentEl.children[0].textContent,
            'part of parent'
          );
          dispose();
          done();
        },
      });
    dispose = run();
  });

  it('should allow recursive isolation using the same scope', done => {
    function Item(_sources: {DOM: MainDOMSource}, count: number) {
      const childVdom$: Stream<VNode> =
        count > 0
          ? isolate(Item, '0')(_sources, count - 1).DOM
          : xs.of<any>(null);

      const highlight$ = _sources.DOM.select('button')
        .events('click')
        .mapTo(true)
        .fold((x, _) => !x, false);

      const vdom$ = xs
        .combine(childVdom$, highlight$)
        .map(([childVdom, highlight]) =>
          div([
            button('.btn', highlight ? 'HIGHLIGHTED' : 'click me'),
            childVdom,
          ])
        );
      return {DOM: vdom$};
    }

    function main(_sources: {DOM: MainDOMSource}) {
      const vdom$ = Item(_sources, 3).DOM;
      return {DOM: vdom$};
    }

    const {sinks, sources, run} = setup(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const buttons = root.querySelectorAll('.btn');
          assert.strictEqual(buttons.length, 4);
          const firstButton = buttons[0];
          const secondButton = buttons[1];
          const thirdButton = buttons[2] as HTMLElement;
          const forthButton = buttons[3];
          setTimeout(() => {
            thirdButton.click();
          }, 100);
          setTimeout(() => {
            assert.notStrictEqual(firstButton.textContent, 'HIGHLIGHTED');
            assert.notStrictEqual(secondButton.textContent, 'HIGHLIGHTED');
            assert.strictEqual(thirdButton.textContent, 'HIGHLIGHTED');
            assert.notStrictEqual(forthButton.textContent, 'HIGHLIGHTED');
            dispose();
            done();
          }, 300);
        },
      });
    dispose = run();
  });

  it('should not lose event delegators when components are moved around', function(done) {
    function component(_sources: {DOM: MainDOMSource}) {
      const click$ = _sources.DOM.select('.click-me')
        .events('click')
        .mapTo('clicked');

      return {
        DOM: xs.of(button('.click-me', 'click me')),
        click$,
      };
    }

    function app(_sources: {DOM: MainDOMSource}) {
      const comp = isolate(component, 'child')(_sources);
      const position$ = fromDiagram('1-2|');
      return {
        DOM: xs.combine(position$, comp.DOM).map(([position, childDom]) => {
          const children =
            position === '1'
              ? [div([childDom]), div()]
              : [div(), div([childDom])];

          return div(children);
        }),

        click$: comp.click$,
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
      click$: () => {},
    });

    const expectedClicks = ['clicked', 'clicked'];
    let dispose: any;
    sinks.click$.take(2).addListener({
      next: function(message: string) {
        assert.strictEqual(message, expectedClicks.shift());
      },
      complete: function() {
        assert.strictEqual(expectedClicks.length, 0);
        done();
        dispose();
      },
    });

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .addListener({
        next: function(root: Element) {
          const _button = root.querySelector('button.click-me') as HTMLElement;
          _button.click();
        },
      });

    dispose = run();
  });

  it('should not break isolation if animated elements are removed', done => {
    let eventProcessed = false;
    function Child(_sources: {DOM: MainDOMSource}): any {
      const remove$ = _sources.DOM.select('.click')
        .events('click')
        .mapTo(false);

      _sources.DOM.select('.click')
        .events('click')
        .addListener({
          next: (ev: any) => {
            assert.strictEqual(ev.target.textContent, 'remove');
            assert.strictEqual(eventProcessed, false);
            eventProcessed = true;
          },
        });

      const style = {
        transition: 'transform 0.5s',
        // remove handler broke isolation in earier versions
        remove: {
          transform: 'translateY(100%)',
        },
      };

      return {
        DOM: xs.of(button('.click', {style}, 'remove')),
        remove: remove$,
      };
    }

    function main(_sources: {DOM: MainDOMSource}): any {
      const childSinks = isolate(Child)(_sources);

      const showChild$ = _sources.DOM.select('.click')
        .events('click')
        .mapTo(true);

      showChild$.addListener({
        next: ev => assert(false),
      });

      const state$ = xs.merge(showChild$, childSinks.remove).startWith(true);

      return {
        DOM: xs
          .combine(state$, childSinks.DOM)
          .map(([show, child]) =>
            div([button('.click', 'show'), show ? child : null])
          ),
      };
    }

    const {sinks, sources, run} = setup(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;

    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: function(root: Element) {
          const _button = root.querySelector(
            'button.click:nth-child(2)'
          ) as HTMLElement;
          assert.strictEqual(_button.textContent, 'remove');
          _button.click();
          setTimeout(() => {
            assert.strictEqual(eventProcessed, true);
            assert.strictEqual(root.querySelectorAll('button').length, 1);
            dispose();
            done();
          }, 600);
        },
      });

    dispose = run();
  });
});
