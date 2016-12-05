/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />

import * as assert from 'assert';
import { StreamAdapter, Observer } from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import MostAdapter from '@cycle/most-adapter';
import RxJSAdapter from '@cycle/rxjs-adapter';
import { makeServerHistoryDriver, Location } from '../../src';

describe('makeServerHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeServerHistoryDriver, 'function');
  });

  it('should return a function' , () => {
    assert.strictEqual(typeof makeServerHistoryDriver(), 'function');
  });
});

runTests(XStreamAdapter, 'xstream');
runTests(MostAdapter, 'most');
runTests(RxJSAdapter, 'RxJS');

function runTests (adapter: StreamAdapter, streamLibrary: string) {
  describe(`serverHistoryDriver - ${streamLibrary}`, () => {
    it('should return a stream', () => {
      const stream = adapter.makeSubject().stream;
      const historyDriver = makeServerHistoryDriver();

      assert(adapter.isValidStream(historyDriver(stream, adapter)));
    });

    it('should create a location from pathname', (done) => {
      const { next, listen } = buildTest(adapter);

      listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, '/test');
          done();
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => { next('/test'); }, 0);
    });

    it('should create a location from PushHistoryInput', (done) => {
      const { next, listen } = buildTest(adapter);

      listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, '/test');
          done();
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => {
        next({ type: 'push', pathname: '/test' });
      }, 0);
    });

    it('should create a location from ReplaceHistoryInput', (done) => {
      const { next, listen } = buildTest(adapter);

      listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, '/test');
          done();
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => { next({ type: 'replace', pathname: '/test' }); }, 0);
    });

    it('should allow going back a route with type `go`', (done) => {
      const { next, listen } = buildTest(adapter);

      const expected = [
        '/test',
        '/other',
        '/test',
      ];

      listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, expected.shift());
          if (expected.length === 0) {
            done();
          }
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => {
        next('/test');
        next('/other');
        next({ type: 'go', amount: -1 });
      }, 0);
    });

    it('should allow going back a route with type `goBack`', (done) => {
      const { next, listen } = buildTest(adapter);

      const expected = [
        '/test',
        '/other',
        '/test',
      ];

      listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, expected.shift());
          if (expected.length === 0) {
            done();
          }
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => {
        next('/test');
        next('/other');
        next({ type: 'goBack' });
      }, 0);
    });

    it('should allow going forward a route with type `go`', (done) => {
      const { next, listen } = buildTest(adapter);

      const expected = [
        '/test',
        '/other',
        '/test',
        '/other',
      ];

      listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, expected.shift());
          if (expected.length === 0) {
            done();
          }
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => {
        next('/test');
        next('/other');
        next({ type: 'go', amount: -1 });
        next({ type: 'go', amount: 1 });
      }, 0);
    });

    it('should allow going forward a route with type `goForward`', (done) => {
      const { next, listen } = buildTest(adapter);

      const expected = [
        '/test',
        '/other',
        '/test',
        '/other',
      ];

      listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, expected.shift());
          if (expected.length === 0) {
            done();
          }
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => {
        next('/test');
        next('/other');
        next({ type: 'go', amount: -1 });
        next({ type: 'goForward' });
      }, 0);
    });
  });
}


function buildTest (adapter: StreamAdapter) {
  const { observer: { next }, stream } = adapter.makeSubject();
  const historyDriver = makeServerHistoryDriver();

  const history$ = historyDriver(stream, adapter);

  function listen (observer: Observer<any>) {
    const noopObserver = {
      next: () => void 0,
      error: () => void 0,
      complete: () => void 0,
    };

    adapter.streamSubscribe(history$, (Object as any).assign({}, noopObserver, observer));
  }

  return { next, listen };
}
