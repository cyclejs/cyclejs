import * as assert from 'assert';
import {
  of,
  pipe,
  take,
  subscribe,
  never,
  merge,
  map,
  drop,
} from '@cycle/callbags';
import { setup, run as cycleRun } from '@cycle/run';
import { jsx } from 'snabbdom';
import {
  svg,
  div,
  thunk,
  h2,
  h4,
  select,
  option,
  p,
  makeDomPlugin,
  DomApi,
  foreignObject,
} from '../../src/index';

import { createRenderTarget, interval } from './helpers';

describe('DOM Rendering', function () {
  it('should render DOM elements even when DOMSource is not utilized', function (done) {
    function main() {
      return {
        DOM: of(div('.my-render-only-container', [h2('Cycle.js framework')])),
      };
    }

    cycleRun(main, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    setTimeout(() => {
      const myContainer = document.querySelector(
        '.my-render-only-container'
      ) as HTMLElement;
      assert.notStrictEqual(myContainer, null);
      assert.notStrictEqual(typeof myContainer, 'undefined');
      assert.strictEqual(myContainer.tagName, 'DIV');
      const header = myContainer.querySelector('h2') as HTMLElement;
      assert.notStrictEqual(header, null);
      assert.notStrictEqual(typeof header, 'undefined');
      assert.strictEqual(header.textContent, 'Cycle.js framework');
      done();
    }, 150);
  });

  it('should support snabbdom dataset module by default', function (done) {
    const thisBrowserSupportsDataset =
      typeof document.createElement('DIV').dataset !== 'undefined';

    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          div('.my-class', {
            dataset: { foo: 'Foo' },
          })
        ),
      };
    }

    if (!thisBrowserSupportsDataset) {
      done();
    } else {
      const { sinks, sources, run } = setup(app, {
        DOM: makeDomPlugin(createRenderTarget()),
      });

      let dispose: any;
      pipe(
        sources.DOM.element(),
        take(1),
        subscribe(root => {
          const elem = root.querySelector('.my-class') as HTMLElement;
          assert.notStrictEqual(elem, null);
          assert.notStrictEqual(typeof elem, 'undefined');
          assert.strictEqual(elem.tagName, 'DIV');
          assert.strictEqual(elem.dataset.foo, 'Foo');
          setTimeout(() => {
            dispose();
            done();
          });
        })
      );
      dispose = run();
    }
  });

  it('should render in a DocumentFragment as container', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          select('.my-class', [
            option({ attrs: { value: 'foo' } }, 'Foo'),
            option({ attrs: { value: 'bar' } }, 'Bar'),
            option({ attrs: { value: 'baz' } }, 'Baz'),
          ])
        ),
      };
    }

    const docfrag = document.createDocumentFragment();

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(docfrag),
    });

    let dispose: any;
    pipe(
      sources.DOM.element(),
      take(1),
      subscribe(root => {
        const selectEl = root.querySelector('.my-class') as HTMLElement;
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'SELECT');
        const options = selectEl.querySelectorAll('option');
        assert.strictEqual(options.length, 3);
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should convert a simple virtual-dom <select> to DOM element', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          select('.my-class', [
            option({ attrs: { value: 'foo' } }, 'Foo'),
            option({ attrs: { value: 'bar' } }, 'Bar'),
            option({ attrs: { value: 'baz' } }, 'Baz'),
          ])
        ),
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
        const selectEl = root.querySelector('.my-class') as HTMLElement;
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'SELECT');
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should convert a simple virtual-dom <select> (JSX) to DOM element', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          <select class={{ 'my-class': true }}>
            <option value="foo">Foo</option>
            <option value="bar">Bar</option>
            <option value="baz">Baz</option>
          </select>
        ),
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
        const selectEl = root.querySelector('.my-class') as HTMLSelectElement;
        assert.notStrictEqual(selectEl, null);
        assert.notStrictEqual(typeof selectEl, 'undefined');
        assert.strictEqual(selectEl.tagName, 'SELECT');
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should reuse existing DOM tree under the given root element', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          select('.my-class', [
            option({ attrs: { value: 'foo' } }, 'Foo'),
            option({ attrs: { value: 'bar' } }, 'Bar'),
            option({ attrs: { value: 'baz' } }, 'Baz'),
          ])
        ),
      };
    }

    // Create DOM tree with 2 <option>s under <select>
    const rootElem = createRenderTarget();
    const selectElem = document.createElement('SELECT');
    selectElem.className = 'my-class';
    rootElem.appendChild(selectElem);
    const optionElem1 = document.createElement('OPTION');
    optionElem1.setAttribute('value', 'foo');
    optionElem1.textContent = 'Foo';
    selectElem.appendChild(optionElem1);
    const optionElem2 = document.createElement('OPTION');
    optionElem2.setAttribute('value', 'bar');
    optionElem2.textContent = 'Bar';
    selectElem.appendChild(optionElem2);

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(rootElem),
    });

    let dispose: any;
    pipe(
      sources.DOM.element(),
      take(1),
      subscribe(root => {
        assert.strictEqual(root.childNodes.length, 1);
        const selectEl = root.childNodes[0] as HTMLElement;
        assert.strictEqual(selectEl.tagName, 'SELECT');
        assert.strictEqual(selectEl.childNodes.length, 3);
        const option1 = selectEl.childNodes[0] as HTMLElement;
        const option2 = selectEl.childNodes[1] as HTMLElement;
        const option3 = selectEl.childNodes[2] as HTMLElement;
        assert.strictEqual(option1.tagName, 'OPTION');
        assert.strictEqual(option2.tagName, 'OPTION');
        assert.strictEqual(option3.tagName, 'OPTION');
        assert.strictEqual(option1.textContent, 'Foo');
        assert.strictEqual(option2.textContent, 'Bar');
        assert.strictEqual(option3.textContent, 'Baz');
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should give elements as a value-over-time', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: merge(of(h2('.value-over-time', 'Hello test')), never()),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    let firstSubscriberRan = false;
    let secondSubscriberRan = false;

    const element$ = sources.DOM.element();

    pipe(
      element$,
      take(1),
      subscribe(root => {
        assert.strictEqual(firstSubscriberRan, false);
        firstSubscriberRan = true;
        const header = root.querySelector('.value-over-time') as HTMLElement;
        assert.notStrictEqual(header, null);
        assert.notStrictEqual(typeof header, 'undefined');
        assert.strictEqual(header.tagName, 'H2');
      })
    );

    setTimeout(() => {
      // This samples the element$ after 400ms, and should synchronously get
      // some element into the subscriber.
      assert.strictEqual(secondSubscriberRan, false);
      pipe(
        element$,
        take(1),
        subscribe(root => {
          assert.strictEqual(secondSubscriberRan, false);
          secondSubscriberRan = true;
          const header = root.querySelector('.value-over-time') as HTMLElement;
          assert.notStrictEqual(header, null);
          assert.notStrictEqual(typeof header, 'undefined');
          assert.strictEqual(header.tagName, 'H2');
          setTimeout(() => {
            dispose();
            done();
          });
        })
      );
      assert.strictEqual(secondSubscriberRan, true);
    }, 400);
    dispose = run();
  });

  it('should allow snabbdom Thunks in the VTree', function (done) {
    function renderThunk(greeting: string) {
      return h4('Constantly ' + greeting);
    }

    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: pipe(
          interval(10),
          take(5),
          map(_ => div([thunk('h4', 'key1', renderThunk, ['hello' + 0])]))
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    pipe(
      sources.DOM.select('*').element(),
      take(1),
      subscribe(root => {
        const h4Elem = root.querySelector('h4') as HTMLElement;
        assert.notStrictEqual(h4Elem, null);
        assert.notStrictEqual(typeof h4Elem, 'undefined');
        assert.strictEqual(h4Elem.tagName, 'H4');
        assert.strictEqual(h4Elem.textContent, 'Constantly hello0');
        dispose();
        done();
      })
    );
    dispose = run();
  });

  it('should render embedded HTML within SVG <foreignObject>', function (done) {
    const thisBrowserSupportsForeignObject = (
      document as any
    ).implementation.hasFeature(
      'www.http://w3.org/TR/SVG11/feature#Extensibility',
      '1.1'
    );

    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(
          svg({ attrs: { width: 150, height: 50 } }, [
            foreignObject({ attrs: { width: '100%', height: '100%' } }, [
              p('.embedded-text', 'This is HTML embedded in SVG'),
            ]),
          ])
        ),
      };
    }

    if (!thisBrowserSupportsForeignObject) {
      done();
    } else {
      const { sinks, sources, run } = setup(app, {
        DOM: makeDomPlugin(createRenderTarget()),
      });

      let dispose: any;

      pipe(
        sources.DOM.select('*').element(),
        take(1),
        subscribe(root => {
          const embeddedHTML = root.querySelector(
            'p.embedded-text'
          ) as HTMLElement;
          assert.strictEqual(
            embeddedHTML.namespaceURI,
            'http://www.w3.org/1999/xhtml'
          );
          assert.notStrictEqual(embeddedHTML.clientWidth, 0);
          assert.notStrictEqual(embeddedHTML.clientHeight, 0);
          setTimeout(() => {
            dispose();
            done();
          });
        })
      );

      dispose = run();
    }
  });

  it('should filter out null/undefined children', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: pipe(
          interval(10),
          take(5),
          map(_ =>
            div('.parent', [
              'Child 1',
              null,
              h4('.child3', [
                null,
                'Grandchild 31',
                div('.grandchild32', [null, 'Great grandchild 322']),
              ]),
              undefined,
            ])
          )
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    pipe(
      sources.DOM.select('*').element(),
      take(1),
      subscribe(root => {
        const divParent = root.querySelector('div.parent') as HTMLElement;
        const h4Child = root.querySelector('h4.child3') as HTMLElement;
        const grandchild = root.querySelector(
          'div.grandchild32'
        ) as HTMLElement;
        assert.strictEqual(divParent.childNodes.length, 2);
        assert.strictEqual(h4Child.childNodes.length, 2);
        assert.strictEqual(grandchild.childNodes.length, 1);
        dispose();
        done();
      })
    );
    dispose = run();
  });

  it('should render correctly even if hyperscript-helper first is empty string', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(h4('', {}, ['Hello world'])),
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
        const H4 = root.querySelector('h4') as HTMLElement;
        assert.strictEqual(H4.textContent, 'Hello world');
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });

  it('should render textContent "0" given hyperscript content value number 0', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(div('.my-class', 0)),
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
        const divEl = root.querySelector('.my-class') as HTMLElement;
        assert.strictEqual(divEl.textContent, '0');
        setTimeout(() => {
          dispose();
          done();
        });
      })
    );
    dispose = run();
  });
});
