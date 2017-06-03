/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';

import {
  Location,
  captureClicks,
  makeHashHistoryDriver,
  makeHistoryDriver,
} from '../../src';
import {createMemoryHistory} from 'history';
import xs from 'xstream';

describe('makeHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeHistoryDriver, 'function');
  });

  it('should return a function', () => {
    assert.strictEqual(typeof makeHistoryDriver(), 'function');
  });

  it('should return allow injecting History object directly', () => {
    const history = createMemoryHistory();
    assert.strictEqual(typeof makeHistoryDriver(history), 'function');
  });

  it('should start emitting the current location', function(done) {
    const history$ = makeHistoryDriver()(xs.never());

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

// This is skipped because somehow, IN LATEST FIREFOX IN WIN10, state is being
// carried around between tests. Tests work when run separately, but when run
// all together, something fails.
describe.skip('makeHashHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeHashHistoryDriver, 'function');
  });

  it('should return a function', () => {
    assert.strictEqual(typeof makeHashHistoryDriver(), 'function');
  });

  it('should start emitting the current location', function(done) {
    const history$ = makeHashHistoryDriver()(xs.never());

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

describe('captureClicks', () => {
  it('should allow listening to link clicks and change route', function(done) {
    const historyDriver = makeHistoryDriver();
    const history$ = captureClicks(historyDriver)(xs.never());

    const sub = history$.drop(1).subscribe({
      next: (location: Location) => {
        assert.strictEqual(location.pathname, '/test');
        sub.unsubscribe();
        done();
      },
      error: err => {},
      complete: () => {},
    });

    const a = document.createElement('a');
    a.href = '/test';
    document.body.appendChild(a);

    setTimeout(() => {
      a.click();
    });
  });
});
