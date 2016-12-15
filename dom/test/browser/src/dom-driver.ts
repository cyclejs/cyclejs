import * as assert from 'assert';
import xs, {Stream, MemoryStream} from 'xstream';
import delay from 'xstream/extra/delay';
import flattenSequentially from 'xstream/extra/flattenSequentially';
import {setup} from '@cycle/run';
import {div, h3, makeDOMDriver, DOMSource, MainDOMSource} from '../../../lib';

function createRenderTarget(id: string | null = null) {
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
      makeDOMDriver(element as Element);
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
      makeDOMDriver(123 as any);
    }, /Given container is not a DOM element neither a selector string/);
  });
});

describe('DOM Driver', function () {
  it('should throw if input is not an Observable<VTree>', function () {
    const domDriver = makeDOMDriver(createRenderTarget());
    assert.throws(function () {
      domDriver({} as any);
    }, /The DOM driver function expects as input a Stream of virtual/);
  });

  it('should have isolateSource() and isolateSink() in source', function (done) {
    function app(sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div()),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    let dispose = run();
    assert.strictEqual(typeof sources.DOM.isolateSource, 'function');
    assert.strictEqual(typeof sources.DOM.isolateSink, 'function');
    dispose();
    done();
  });

  it('should not work after has been disposed', function (done) {
    const num$ = xs.of(1, 2, 3)
      .map(x => xs.of(x).compose(delay(50)))
      .compose(flattenSequentially);

    function app(sources: {DOM: DOMSource}) {
      return {
        DOM: num$.map(num =>
            h3('.target', String(num)),
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    sources.DOM.select(':root').elements()
      .drop(1)
      .addListener({
        next: (root: Element) => {
          const selectEl = root.querySelector('.target') as Element;
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
        },
      });
    dispose = run();
  });

  it('should clean up DOM on disposal', function (done) {
    let hookTick = 0;
    let hookInterval: any;
    let hook = {
      insert: () => {
        hookInterval = setInterval(() => hookTick++, 10);
      },
      destroy: () => {
        clearInterval(hookInterval);
      },
    };

    function app() {
      return {
        DOM: xs.of(
            h3('.target', {hook}, 'dummy text'),
        ),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget('disposal')),
    });

    const dispose = run();
    setTimeout(() => {
      dispose();
      const hookTickOnDisposal = hookTick;

      setTimeout(() => {
        let renderTarget = document.getElementById('disposal') as Element;
        assert.equal(renderTarget.innerHTML, '');
        assert.ok(hookTick > 0);
        assert.equal(hookTickOnDisposal, hookTick);
        done();
      }, 50);
    }, 100);
  });
});
