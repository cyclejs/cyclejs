import {describe, it} from 'mocha';
import assert from 'assert';
import RxJSAdapter from '../lib';
import {Observable, ReplaySubject} from 'rxjs';

describe('RxJSAdapter', () => {
  it('should conform to StreamLibrary interface', () => {
    assert.strictEqual(typeof RxJSAdapter, 'object');
    assert.strictEqual(typeof RxJSAdapter.adapt, 'function');
    assert.strictEqual(typeof RxJSAdapter.dispose, 'function');
    assert.strictEqual(typeof RxJSAdapter.makeHoldSubject, 'function');
    assert.strictEqual(typeof RxJSAdapter.isValidStream, 'function');
    assert.strictEqual(typeof RxJSAdapter.streamSubscribe, 'function');
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
    const rxStream = RxJSAdapter.adapt(dummyStream, arraySubscribe);
    assert.strictEqual(RxJSAdapter.isValidStream(rxStream), true);
    const expected = [1, 2, 3];
    rxStream.subscribe(x => {
      assert.strictEqual(x, expected.shift());
    }, done.fail, () => {
      assert.strictEqual(expected.length, 0);
      done();
    });
  });

  it('should create a hold subject which can be fed and subscribed to', (done) => {
    const holdSubject = RxJSAdapter.makeHoldSubject();
    assert.strictEqual(holdSubject.stream instanceof ReplaySubject, true);
    assert.strictEqual(RxJSAdapter.isValidStream(holdSubject.stream), true);

    const observer1Expected = [1, 2, 3, 4];
    const observer2Expected = [2, 3, 4];

    RxJSAdapter.streamSubscribe(holdSubject.stream, {
      next: (x) => assert.strictEqual(x, observer1Expected.shift()),
      error: done.fail,
      complete: () => assert.strictEqual(observer1Expected.length, 0),
    });

    holdSubject.observer.next(1);
    holdSubject.observer.next(2);

    RxJSAdapter.streamSubscribe(holdSubject.stream, {
      next: (x) => assert.strictEqual(x, observer2Expected.shift()),
      error: done.fail,
      complete: () => assert.strictEqual(observer2Expected.length, 0),
    });

    holdSubject.observer.next(3);
    holdSubject.observer.next(4);
    holdSubject.observer.complete();

    setTimeout(done, 20);
  });
});
