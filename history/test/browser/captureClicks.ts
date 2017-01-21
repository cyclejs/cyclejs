/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';
import xs from 'xstream';
import {makeHashHistoryDriver, captureClicks, Location} from '../../src';

describe('captureClicks', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('should allow listening to link clicks and change route', function (done) {
    const historyDriver = makeHashHistoryDriver();
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
