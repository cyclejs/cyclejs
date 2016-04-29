import {describe, it} from 'mocha';
import assert from 'assert';
import XStreamAdapter from '../lib';
import * as xs from 'xstream';

describe('XStreamAdapter', () => {
  it('should conform to StreamLibrary interface', () => {
    assert.strictEqual(typeof XStreamAdapter, 'object');
    assert.strictEqual(typeof XStreamAdapter.adapt, 'function');
    assert.strictEqual(typeof XStreamAdapter.dispose, 'function');
    assert.strictEqual(typeof XStreamAdapter.makeHoldSubject, 'function');
    assert.strictEqual(typeof XStreamAdapter.isValidStream, 'function');
    assert.strictEqual(typeof XStreamAdapter.streamSubscribe, 'function');
  });

  it('should adapt from a dummy adapter to this adapter stream', (done) => {
    function arraySubscribe(array, observer) {
      array.forEach(value => {
        observer.next(value);
      });
      observer.complete();
      return () => {};
    }

    const dummyStream = [1, 2, 3];
    const stream = XStreamAdapter.adapt(dummyStream, arraySubscribe);
    assert.strictEqual(XStreamAdapter.isValidStream(stream), true);
    const expected = [1, 2, 3];
    stream.addListener({
      next(x) { assert.strictEqual(x, expected.shift()); },
      error: done,
      complete() {
        assert.strictEqual(expected.length, 0)
        done()
      }
    })
  });

  it('should create a hold subject which can be fed and subscribed to', (done) => {
    const holdSubject = XStreamAdapter.makeHoldSubject();
    assert.strictEqual(holdSubject.stream instanceof xs.MemoryStream, true);
    assert.strictEqual(XStreamAdapter.isValidStream(holdSubject.stream), true);

    const observer1Expected = [1, 2, 3, 4];
    const observer2Expected = [2, 3, 4];

    XStreamAdapter.streamSubscribe(holdSubject.stream, {
      next: (x) => assert.strictEqual(x, observer1Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer1Expected.length, 0),
    });

    holdSubject.observer.next(1);
    holdSubject.observer.next(2);

    XStreamAdapter.streamSubscribe(holdSubject.stream, {
      next: (x) => assert.strictEqual(x, observer2Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer2Expected.length, 0),
    });

    holdSubject.observer.next(3);
    holdSubject.observer.next(4);
    holdSubject.observer.complete();

    setTimeout(done, 20);
  });
});
