import * as assert from 'assert';
import { pipe, take, subscribe, of } from '@cycle/callbags';
import { setup } from '@cycle/run';
import {
  svg,
  div,
  span,
  h2,
  h3,
  h4,
  p,
  makeDomPlugin,
  DomApi,
  polygon,
} from '../../src/index';

import { createRenderTarget } from './helpers';

describe('DOMSource.select()', function () {
  it('should have Observable namespace root in DOM source', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(div('.top-most', [p('Foo'), span('Bar')])),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    pipe(
      sources.DOM.element(),
      take(1),
      subscribe(root => {
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
      })
    );
    dispose = run();
  });

  it('should return a DOMSource with elements(), events(), select()', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(h3('.myelementclass', 'Foobar')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    const dispose = run();
    // Make assertions
    const selection = sources.DOM.select('.myelementclass');
    assert.strictEqual(typeof selection, 'object');
    assert.strictEqual(typeof selection.select, 'function');
    assert.strictEqual(typeof selection.select('h3'), 'object');
    assert.strictEqual(typeof selection.elements, 'function');
    assert.strictEqual(typeof selection.element(), 'function');
    assert.strictEqual(typeof selection.elements(), 'function');
    assert.strictEqual(typeof selection.events, 'function');
    assert.strictEqual(typeof selection.events('click'), 'function');
    dispose();
    done();
  });

  it('should have an observable of DOM elements', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(h3('.myelementclass', 'Foobar')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    // Make assertions
    pipe(
      sources.DOM.select('.myelementclass').elements(),
      take(1),
      subscribe(elements => {
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
      })
    );
    dispose = run();
  });

  it('should not select element outside the given scope', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          h3('.top-most', [
            h2('.bar', 'Wrong'),
            div('.foo', [h4('.bar', 'Correct')]),
          ])
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    // Make assertions
    pipe(
      sources.DOM.select('.foo').select('.bar').elements(),
      take(1),
      subscribe(elements => {
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
      })
    );
    dispose = run();
  });

  it('should select svg element', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          svg({ attrs: { width: 150, height: 150 } }, [
            polygon({
              attrs: {
                class: 'triangle',
                points: '20 0 20 150 150 20',
              },
            }),
          ])
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    // Make assertions
    pipe(
      sources.DOM.select('.triangle').elements(),
      take(1),
      subscribe(elements => {
        assert.strictEqual(elements.length, 1);
        const triangleElement = elements[0];
        assert.notStrictEqual(triangleElement, null);
        assert.notStrictEqual(typeof triangleElement, 'undefined');
        assert.strictEqual(triangleElement.tagName, 'polygon');
        done();
      })
    );
    run();
  });

  /*it('should support selecting the document element', function(done) {
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
  });*/
});
