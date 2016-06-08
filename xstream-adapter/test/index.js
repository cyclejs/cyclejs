import {describe, it} from 'mocha';
import assert from 'assert';
import XStreamAdapter from '../lib';
import xs from 'xstream';
import {MemoryStream, Stream} from 'xstream';

describe('XStreamAdapter', () => {
  it('should conform to StreamLibrary interface', () => {
    assert.strictEqual(typeof XStreamAdapter, 'object');
    assert.strictEqual(typeof XStreamAdapter.adapt, 'function');
    assert.strictEqual(typeof XStreamAdapter.remember, 'function');
    assert.strictEqual(typeof XStreamAdapter.makeSubject, 'function');
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

  it('should create a subject which can be fed and subscribed to', (done) => {
    const subject = XStreamAdapter.makeSubject();
    assert.strictEqual(subject.stream instanceof Stream, true);
    assert.strictEqual(XStreamAdapter.isValidStream(subject.stream), true);

    const observer1Expected = [1, 2, 3, 4];
    const observer2Expected = [3, 4];

    XStreamAdapter.streamSubscribe(subject.stream, {
      next: (x) => assert.strictEqual(x, observer1Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer1Expected.length, 0),
    });

    subject.observer.next(1);
    subject.observer.next(2);

    XStreamAdapter.streamSubscribe(subject.stream, {
      next: (x) => assert.strictEqual(x, observer2Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer2Expected.length, 0),
    });

    subject.observer.next(3);
    subject.observer.next(4);
    subject.observer.complete();

    setTimeout(done, 20);
  });

  it('should create a remembered subject which can be fed and subscribed to', (done) => {
    const subject = XStreamAdapter.makeSubject();
    assert.strictEqual(subject.stream instanceof Stream, true);
    assert.strictEqual(XStreamAdapter.isValidStream(subject.stream), true);
    const remembered = XStreamAdapter.remember(subject.stream);

    const observer1Expected = [1, 2, 3, 4];
    const observer2Expected = [2, 3, 4];

    XStreamAdapter.streamSubscribe(remembered, {
      next: (x) => assert.strictEqual(x, observer1Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer1Expected.length, 0),
    });

    subject.observer.next(1);
    subject.observer.next(2);

    XStreamAdapter.streamSubscribe(remembered, {
      next: (x) => assert.strictEqual(x, observer2Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer2Expected.length, 0),
    });

    subject.observer.next(3);
    subject.observer.next(4);
    subject.observer.complete();

    setTimeout(done, 20);
  });
});
