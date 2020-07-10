import * as assert from 'assert';
import {Location, makeHistoryDriver, makeServerHistoryDriver} from '../../src';
import {createMemoryHistory} from 'history';
import xs from 'xstream';

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

  it('should start emitting the current location', function(done) {
    const history$ = makeServerHistoryDriver()(xs.never());

    const sub = history$.subscribe({
      next: (location: Location) => {
        assert(location.pathname);
        done();
      },
      error: err => {},
      complete: () => {},
    });

    setTimeout(() => {
      sub.unsubscribe();
    });
  });
});
