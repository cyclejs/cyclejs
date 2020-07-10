import './setup'; // tslint:disable-line
import * as simulant from 'simulant';
import * as assert from 'assert';
import isolate from '@cycle/isolate';
import xs, {Stream, MemoryStream} from 'xstream';
import delay from 'xstream/extra/delay';
import concat from 'xstream/extra/concat';
import {setup} from '@cycle/run';
import {
  svg,
  div,
  span,
  h2,
  h3,
  h4,
  p,
  makeDOMDriver,
  MainDOMSource,
  VNode,
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

describe('DOMSource.select()', function() {
  it('should have Observable `:root` in DOM source', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('.top-most', [p('Foo'), span('Bar')])),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select(':root')
      .element()
      .drop(1)
      .take(1)
      .addListener({
        next: (root: Element) => {
          const classNameRegex = /top\-most/;
          assert.strictEqual(root.tagName, 'DIV');
          const child = root.children[0];
          const execResult = classNameRegex.exec(child.className);
          assert.notStrictEqual(execResult, null);
          assert.strictEqual((execResult as any)[0], 'top-most');
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
  });

  it('should return a DOMSource with elements(), events(), select()', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(h3('.myelementclass', 'Foobar')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const dispose = run();
    // Make assertions
    const selection = sources.DOM.select('.myelementclass');
    assert.strictEqual(typeof selection, 'object');
    assert.strictEqual(typeof selection.select, 'function');
    assert.strictEqual(typeof selection.select('h3'), 'object');
    assert.strictEqual(typeof selection.elements, 'function');
    assert.strictEqual(typeof selection.element(), 'object');
    assert.strictEqual(typeof selection.element().subscribe, 'function');
    assert.strictEqual(typeof selection.elements(), 'object');
    assert.strictEqual(typeof selection.elements().subscribe, 'function');
    assert.strictEqual(typeof selection.events, 'function');
    assert.strictEqual(typeof selection.events('click'), 'object');
    assert.strictEqual(typeof selection.events('click').subscribe, 'function');
    dispose();
    done();
  });

  it('should have an observable of DOM elements', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(h3('.myelementclass', 'Foobar')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    // Make assertions
    sources.DOM.select('.myelementclass')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.notStrictEqual(elements, null);
          assert.notStrictEqual(typeof elements, 'undefined');
          // Is an Array
          assert.strictEqual(Array.isArray(elements), true);
          assert.strictEqual(elements.length, 1);
          // Array with the H3 element
          assert.strictEqual(elements[0].tagName, 'H3');
          assert.strictEqual(elements[0].textContent, 'Foobar');
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
  });

  it('should not select element outside the given scope', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.foo', [h4('.bar', 'Correct')]),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    // Make assertions
    sources.DOM.select('.foo')
      .select('.bar')
      .elements()
      .drop(1)
      .take(1)
      .addListener({
        next: (elements: Array<Element>) => {
          assert.strictEqual(elements.length, 1);
          const element = elements[0];
          assert.notStrictEqual(element, null);
          assert.notStrictEqual(typeof element, 'undefined');
          assert.strictEqual(element.tagName, 'H4');
          assert.strictEqual(element.textContent, 'Correct');
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
  });

  it('should select svg element', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(
          svg({attrs: {width: 150, height: 150}}, [
            svg.polygon({
              attrs: {
                class: 'triangle',
                points: '20 0 20 150 150 20',
              },
            }),
          ])
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    // Make assertions
    const selection = sources.DOM.select('.triangle')
      .elements()
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

  it('should support selecting the document element', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('hello world')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    function isDocument(element: any): element is Document {
      return 'body' in element && 'head' in element;
    }

    let dispose: any;
    sources.DOM.select('document')
      .events('click')
      .take(1)
      .addListener({
        next: (event: Event) => {
          assert(isDocument(event.target));
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
    simulant.fire(document, 'click');
  });

  it('should support selecting the body element', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('hello world')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select('body')
      .events('click')
      .take(1)
      .addListener({
        next: (event: Event) => {
          assert.equal((event.target as HTMLElement).tagName, 'BODY');
          setTimeout(() => {
            dispose();
            done();
          });
        },
      });
    dispose = run();
    simulant.fire(document.body, 'click');
  });

  it('should have DevTools flag in BodyDOMSource element() stream', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('hello world')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const element$ = sources.DOM.select('body').element();
    assert.strictEqual((element$ as any)._isCycleSource, 'DOM');
    done();
  });

  it('should have DevTools flag in BodyDOMSource elements() stream', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('hello world')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const element$ = sources.DOM.select('body').elements();
    assert.strictEqual((element$ as any)._isCycleSource, 'DOM');
    done();
  });

  it('should have DevTools flag in BodyDOMSource events() stream', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('hello world')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const event$ = sources.DOM.select('body').events('click');
    assert.strictEqual((event$ as any)._isCycleSource, 'DOM');
    done();
  });

  it('should have DevTools flag in DocumentDOMSource element() stream', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('hello world')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const element$ = sources.DOM.select('document').element();
    assert.strictEqual((element$ as any)._isCycleSource, 'DOM');
    done();
  });

  it('should have DevTools flag in DocumentDOMSource elements() stream', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('hello world')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const element$ = sources.DOM.select('document').elements();
    assert.strictEqual((element$ as any)._isCycleSource, 'DOM');
    done();
  });

  it('should have DevTools flag in DocumentDOMSource events() stream', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div('hello world')),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    const event$ = sources.DOM.select('document').events('click');
    assert.strictEqual((event$ as any)._isCycleSource, 'DOM');
    done();
  });
});
