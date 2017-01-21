/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />

import * as assert from 'assert';
import { StreamAdapter, Observer } from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';
import MostAdapter from '@cycle/most-adapter';
import RxJSAdapter from '@cycle/rxjs-adapter';
import xs from 'xstream';
import { makeHashHistoryDriver, captureClicks, Location } from '../../src';

describe('makeServerHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeHashHistoryDriver, 'function');
  });

  it('should return a function' , () => {
    assert.strictEqual(typeof makeHashHistoryDriver(), 'function');
  });
});

describe('captureClicks', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('should listen to link clicks and change route', (done) => {
    const historyDriver = makeHashHistoryDriver();

    const history$ = captureClicks(historyDriver)(xs.never(), XStreamAdapter);

    (history$ as any).addListener({
      next: (location: Location) => {
        assert.strictEqual(location.pathname, url('/test'));
        done();
      },
    });

    let a = document.createElement('a');
    a.href = url('/test');
    document.body.appendChild(a);

    setTimeout(() => {
      a.click();
    });
  });
});

runTests(XStreamAdapter, 'xstream');
runTests(MostAdapter, 'most');
runTests(RxJSAdapter, 'RxJS');

function runTests (adapter: StreamAdapter, streamLibrary: string) {
  describe(`historyDriver - ${streamLibrary}`, () => {
    // beforeEach(() => {
    //   window.location.hash = '';
    // });

    it('should return a stream', () => {
      const stream = adapter.makeSubject().stream;
      const historyDriver = makeHashHistoryDriver();

      assert(adapter.isValidStream(historyDriver(stream, adapter)));
    });

    it('should create a location from pathname', (done) => {
      const { next, listen } = buildTest(adapter);

      const unlisten = listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, url('/test'));
          done();
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => {
        next(url('/test'));
        return unlisten && unlisten();
      }, 0);
    });

    it('should create a location from PushHistoryInput', (done) => {
      const { next, listen } = buildTest(adapter);

      const unlisten = listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, url('/test'));
          done();
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => {
        next({ type: 'push', pathname: url('/test') });
        return unlisten && unlisten();
      }, 0);
    });

    it('should create a location from ReplaceHistoryInput', (done) => {
      const { next, listen } = buildTest(adapter);

      const unlisten = listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, url('/test'));
          done();
        },
        error: done,
        complete: () => void 0,
      });

      setTimeout(() => {
        next({ type: 'replace', pathname: url('/test') });
        return unlisten && unlisten();
      }, 0);
    });

    // going back and forth is unreliable in tests for browser
    // because they cause refresh?
    it.only('should allow going back a route with type `go`', (done) => {
      const { next, listen } = buildTest(adapter);

      const expected = [
        url('/test'),
        url('/other'),
        url('/test'),
      ];

      const unlisten = listen({
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
        next(url('/test'));
        next(url('/other'));
        next({ type: 'go', amount: -3 });
        return unlisten && unlisten();
      }, 0);
    });

    it.skip('should allow going back a route with type `goBack`', (done) => {
      const { next, listen } = buildTest(adapter);

      const expected = [
        url('/test'),
        url('/other'),
        url('/test'),
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
        next(url('/test'));
        next(url('/other'));
        next({ type: 'goBack' });
      }, 0);
    });

    it.skip('should allow going forward a route with type `go`', (done) => {
      const { next, listen } = buildTest(adapter);

      const expected = [
        '/test',
        '/other',
        '/test',
        '/other',
      ];

      const unlisten = listen({
        next (location: Location) {
          assert.strictEqual(location.pathname, expected.shift());
          if (expected.length === 0) {
            done();
          }
        },
        error: done,
        complete: () => void 0,
      });

      next('/test');
      next('/other');
      next({ type: 'goBack' });
      next({ type: 'go', amount: 1 });
      return unlisten && unlisten();
    });

    it.skip('should allow going forward a route with type `goForward`', (done) => {
      const { next, listen } = buildTest(adapter);

      const expected = [
        url('/test'),
        url('/other'),
        url('/test'),
        url('/other'),
      ];

     const unlisten = listen({
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
        next(url('/test'));
        next(url('/other'));
        next({ type: 'goBack' });
        next({ type: 'goForward' });
        return unlisten && unlisten();
      }, 0);
    });
  });
}

function url (path: string) {
  return path;
}

function buildTest (adapter: StreamAdapter) {
  const { observer: { next }, stream } = adapter.makeSubject();
  const historyDriver = makeHashHistoryDriver();

  const history$ = historyDriver(stream, adapter);

  function listen (observer: Observer<any>) {
    const noopObserver = {
      next: () => void 0,
      error: () => void 0,
      complete: () => void 0,
    };

    return adapter.streamSubscribe(history$, (Object as any).assign({}, noopObserver, observer));
  }

  return { next, listen };
}
