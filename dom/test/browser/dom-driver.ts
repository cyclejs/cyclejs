import * as assert from 'assert';
import { setup } from '@cycle/run';
import { never, of, pipe, take, map, drop, subscribe } from '@cycle/callbags';
import { div, h3, makeDomPlugin, DomApi } from '../../src/index';

import { createRenderTarget, interval } from './helpers';

describe('makeDomPlugin', function () {
  it('should accept a DOM element as input', function () {
    const element = createRenderTarget();
    assert.doesNotThrow(function () {
      makeDomPlugin(element);
    });
  });

  it('should accept a DocumentFragment as input', function () {
    const docfrag = document.createDocumentFragment();
    assert.doesNotThrow(function () {
      makeDomPlugin(docfrag);
    });
  });

  it('should accept a string selector to an existing element as input', function () {
    const id = 'testShouldAcceptSelectorToExisting';
    const element = createRenderTarget();
    element.id = id;
    assert.doesNotThrow(function () {
      makeDomPlugin('#' + id);
    });
  });

  it('should not accept a selector to an unknown element as input', function () {
    assert.throws(() => {
      makeDomPlugin('#nonsenseIdToNothing')[0].consumeSink(never());
    }, /Cannot render into unknown element '#nonsenseIdToNothing'/);
  });

  it('should not accept a number as input', function () {
    assert.throws(function () {
      makeDomPlugin(123 as any);
    }, /Given container is not a DOM element neither a selector string/);
  });
});

describe('DOM Plugin', function () {
  it('should have isolateSource() and isolateSink() in source', function (done) {
    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: of(div()),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });
    const dispose = run();
    assert.strictEqual(typeof sources.DOM.isolateSource, 'function');
    assert.strictEqual(typeof sources.DOM.isolateSink, 'function');
    dispose();
    done();
  });

  it('should not work after has been disposed', function (done) {
    const num$ = pipe(
      interval(50),
      take(3),
      map(x => x + 1)
    );

    function app(_sources: { DOM: DomApi }) {
      return {
        DOM: pipe(
          num$,
          map(num => h3('.target', String(num)))
        ),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget()),
    });

    let dispose: any;
    let hasDisposed = false;
    let assertionOngoing = false;
    pipe(
      sources.DOM.select('*').element(),
      drop(1),
      subscribe(root => {
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
      })
    );
    dispose = run();
  });

  it('should clean up DOM on disposal', function (done) {
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
        DOM: of(h3('.target', { hook }, 'dummy text')),
      };
    }

    const { sinks, sources, run } = setup(app, {
      DOM: makeDomPlugin(createRenderTarget('disposal')),
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
