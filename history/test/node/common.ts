/// <reference path="../../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../../node_modules/@types/node/index.d.ts" />
import * as assert from 'assert';
import {Location, makeServerHistoryDriver} from '../../src';
import xs from 'xstream';

describe('makeServerHistoryDriver', () => {
  it('should be a function', () => {
    assert.strictEqual(typeof makeServerHistoryDriver, 'function');
  });

  it('should return a function' , () => {
    assert.strictEqual(typeof makeServerHistoryDriver(), 'function');
  });

  it('should start emitting the current location', function (done) {
    const history$ = makeServerHistoryDriver()(xs.never());

    const sub = history$.subscribe({
      next: (location: Location) => {
        assert(location.pathname);
        done();
      },
      error: (err) => {},
      complete: () => {},
    });

    setTimeout(() => {
      sub.unsubscribe();
    });
  });
});
