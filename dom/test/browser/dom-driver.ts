import {isIE10} from './setup';
import * as assert from 'assert';
import * as sinon from 'sinon';
import xs, {Stream, MemoryStream} from 'xstream';
import delay from 'xstream/extra/delay';
import flattenSequentially from 'xstream/extra/flattenSequentially';
import {setup, run as cycleRun} from '@cycle/run';
import {
  div,
  h3,
  makeDOMDriver,
  DOMSource,
  MainDOMSource,
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

describe('makeDOMDriver', function() {
  it('should accept a DOM element as input', function() {
    const element = createRenderTarget();
    assert.doesNotThrow(function() {
      makeDOMDriver(element);
    });
  });

  it('should accept a DocumentFragment as input', function() {
    if (isIE10) {
      return;
    }
    const docfrag = document.createDocumentFragment();
    assert.doesNotThrow(function() {
      makeDOMDriver(docfrag);
    });
  });

  it('should accept a string selector to an existing element as input', function() {
    const id = 'testShouldAcceptSelectorToExisting';
    const element = createRenderTarget();
    element.id = id;
    assert.doesNotThrow(function() {
      makeDOMDriver('#' + id);
    });
  });

  it('should not accept a selector to an unknown element as input', function(done) {
    const sandbox = sinon.createSandbox();
    sandbox.stub(console, 'error');
    makeDOMDriver('#nonsenseIdToNothing')(xs.never());
    setTimeout(() => {
      sinon.assert.calledOnce(console.error as any);
      sinon.assert.calledWithExactly(
        console.error as any,
        sinon.match({
          message: 'Cannot render into unknown element `#nonsenseIdToNothing`',
        })
      );
      sandbox.restore();
      done();
    }, 100);
  });

  it('should not accept a number as input', function() {
    assert.throws(function() {
      makeDOMDriver(123 as any);
    }, /Given container is not a DOM element neither a selector string/);
  });
});

describe('DOM Driver', function() {
  it('should throw if input is not an Observable<VTree>', function() {
    const domDriver = makeDOMDriver(createRenderTarget());
    assert.throws(function() {
      domDriver({} as any);
    }, /The DOM driver function expects as input a Stream of virtual/);
  });

  it('should have isolateSource() and isolateSink() in source', function(done) {
    function app(_sources: {DOM: MainDOMSource}) {
      return {
        DOM: xs.of(div()),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });
    const dispose = run();
    assert.strictEqual(typeof sources.DOM.isolateSource, 'function');
    assert.strictEqual(typeof sources.DOM.isolateSink, 'function');
    dispose();
    done();
  });

  it('should report errors thrown in hooks', function(done) {
    const sandbox = sinon.createSandbox();
    sandbox.stub(console, 'error');

    function main(sources: {DOM: DOMSource}) {
      return {
        DOM: xs.of(
          div('.test', {
            hook: {
              insert: () => {
                throw new Error('error in hook');
              },
            },
          })
        ),
      };
    }

    cycleRun(main, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    setTimeout(() => {
      sinon.assert.calledOnce(console.error as any);
      sinon.assert.calledWithExactly(
        console.error as any,
        sinon.match({message: 'error in hook'})
      );
      sandbox.restore();
      done();
    }, 100);
  });

  it('should not work after has been disposed', function(done) {
    const num$ = xs
      .of(1, 2, 3)
      .map(x => xs.of(x).compose(delay(50)))
      .compose(flattenSequentially);

    function app(_sources: {DOM: DOMSource}) {
      return {
        DOM: num$.map(num => h3('.target', String(num))),
      };
    }

    const {sinks, sources, run} = setup(app, {
      DOM: makeDOMDriver(createRenderTarget()),
    });

    let dispose: any;
    let hasDisposed = false;
    let assertionOngoing = false;
    sources.DOM.select(':root')
      .element()
      .drop(1)
      .addListener({
        next: (root: Element) => {
          const selectEl = root.querySelector('.target') as Element;
          if (!selectEl && assertionOngoing && hasDisposed) {
            // This synchronous delivery of the empty root element is allowed
            return;
          }
          if (!selectEl && !assertionOngoing && hasDisposed) {
            done(
              'DOM Driver should not emit anything asynchronously after dispose()'
            );
          }
          if (selectEl && hasDisposed) {
            done('DOM Driver should not emit a target element after dispose()');
          }
          assertionOngoing = true;
          assert.notStrictEqual(selectEl, null);
          assert.notStrictEqual(typeof selectEl, 'undefined');
          assert.strictEqual(selectEl.tagName, 'H3');
          assert.notStrictEqual(selectEl.textContent, '3');
          if (selectEl.textContent === '2') {
            hasDisposed = true;
            dispose();
            setTimeout(() => {
              done();
            }, 100);
          }
          assertionOngoing = false;
        },
      });
    dispose = run();
  });

  it('should clean up DOM on disposal', function(done) {
    let hookTick = 0;
    let hookInterval: any;
    const hook = {
      insert: () => {
        hookInterval = setInterval(() => hookTick++, 10);
      },
      destroy: () => {
        clearInterval(hookInterval);
      },
    };

    function app() {
      return {
        DOM: xs.of(h3('.target', {hook}, 'dummy text')),
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
        const renderTarget = document.getElementById('disposal') as Element;
        assert.equal(renderTarget.innerHTML, '');
        assert.ok(hookTick > 0);
        assert.equal(hookTickOnDisposal, hookTick);
        done();
      }, 50);
    }, 100);
  });
});
