/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';
import {Location, makeHistoryDriver, makeServerHistoryDriver} from '../../src';
import {createMemoryHistory} from 'history';
import xs, {Subscription} from 'xstream';

describe('makeServerHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeServerHistoryDriver, 'function');
  });

  it('should return a function', () => {
    assert.strictEqual(typeof makeServerHistoryDriver(), 'function');
  });

  it('should return allow injecting MemoryHistory object directly', () => {
    const history = createMemoryHistory();
    assert.strictEqual(typeof makeHistoryDriver(history), 'function');
  });

  it('should start emitting the current location synchronously', function(
    done,
  ) {
    const sink = xs.never();
    const history$ = makeServerHistoryDriver()(sink);

    const sub = history$.subscribe({
      next: (location: Location) => {
        assert(location.pathname);
        done();
      },
      error: done,
      complete: () => {},
    });

    sub.unsubscribe();
    sink.shamefullySendComplete();
  });
});
