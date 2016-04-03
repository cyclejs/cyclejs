import {describe, it} from 'mocha';
import assert from 'assert';
import MostAdapter from '../lib';
import {Stream} from 'most'

describe('MostAdapter', () => {
  it('should conform to StreamLibrary interface', () => {
    assert.strictEqual(typeof MostAdapter, 'object');
    assert.strictEqual(typeof MostAdapter.adapt, 'function');
    assert.strictEqual(typeof MostAdapter.dispose, 'function');
    assert.strictEqual(typeof MostAdapter.makeHoldSubject, 'function');
    assert.strictEqual(typeof MostAdapter.isValidStream, 'function');
    assert.strictEqual(typeof MostAdapter.streamSubscribe, 'function');
  });

  // TODO
  it('should adapt from a dummy adapter to this adapter stream', (done) => {
    function arraySubscribe(array, observer) {
      array.forEach(value => {
        observer.next(value);
      });
      observer.complete();
      return () => {};
    }

    const dummyStream = [1, 2, 3];
    const mostStream = MostAdapter.adapt(dummyStream, arraySubscribe);
    assert.strictEqual(MostAdapter.isValidStream(mostStream), true);
    const expected = [1, 2, 3];
    mostStream.observe(x => {
      assert.strictEqual(x, expected.shift());
    }).catch(done.fail).then(() => {
      assert.strictEqual(expected.length, 0);
      done();
    });
  });

  // TODO
  it('should create a hold subject which can be fed and subscribed to', (done) => {
    const holdSubject = MostAdapter.makeHoldSubject();
    assert.strictEqual(holdSubject.stream instanceof Stream, true);
    assert.strictEqual(MostAdapter.isValidStream(holdSubject.stream), true);

    const observer1Expected = [1, 2, 3, 4];
    const observer2Expected = [2, 3, 4];

    MostAdapter.streamSubscribe(holdSubject.stream, {
      next: (x) => assert.strictEqual(x, observer1Expected.shift()),
      error: done.fail,
      complete: () => assert.strictEqual(observer1Expected.length, 0),
    });

    holdSubject.observer.next(1);
    holdSubject.observer.next(2);

    MostAdapter.streamSubscribe(holdSubject.stream, {
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
