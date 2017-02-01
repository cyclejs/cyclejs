/// <reference path="../../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';
import xs from 'xstream';
import {makeHashHistoryDriver, makeHistoryDriver, captureClicks, Location} from '../../../lib';

describe('makeHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeHistoryDriver, 'function');
  });

  it('should return a function' , () => {
    assert.strictEqual(typeof makeHistoryDriver(), 'function');
  });
});

describe('makeHashHistoryDriver', () => {
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

  it('should allow listening to link clicks and change route', function (done) {
    const historyDriver = makeHistoryDriver();
    const history$ = captureClicks(historyDriver)(xs.never());

    const sub = history$.subscribe({
      next: (location: Location) => {
        assert.strictEqual(location.pathname, '/test');
        sub.unsubscribe();
        done();
      },
      error: (err) => {},
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
