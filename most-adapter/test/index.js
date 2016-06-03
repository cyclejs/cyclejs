import {describe, it} from 'mocha'
import assert from 'power-assert'
import StreamAdapter from '../lib/index'
import most from 'most'

describe('StreamAdapter', () => {
  it('should conform to StreamLibrary interface', () => {
    assert.strictEqual(typeof StreamAdapter, 'object')
    assert.strictEqual(typeof StreamAdapter.adapt, 'function')
    assert.strictEqual(typeof StreamAdapter.dispose, 'function')
    assert.strictEqual(typeof StreamAdapter.makeSubject, 'function')
    assert.strictEqual(typeof StreamAdapter.isValidStream, 'function')
    assert.strictEqual(typeof StreamAdapter.streamSubscribe, 'function')
  })

  it('should adapt from a dummy adapter to this adapter stream', (done) => {
    function arraySubscribe (array, observer) {
      // most is 100% designed to be consumed asynchronously
      setTimeout(() => {
        array.forEach(value => {
          observer.next(value)
        })
        observer.complete()
      })
      return () => {}
    }

    const dummyStream = [1, 2, 3]

    const stream = StreamAdapter.adapt(dummyStream, arraySubscribe)

    assert.strictEqual(StreamAdapter.isValidStream(stream), true)

    const expected = [1, 2, 3]

    stream
      .observe(x => { assert.strictEqual(x, expected.shift()) })
      .then(() => {
        assert.strictEqual(expected.length, 0)
        done()
      })
      .catch(done)
  })

  it('should create a subject which can be fed and subscribed to', (done) => {
    const subject = StreamAdapter.makeSubject()
    assert.strictEqual(subject.stream instanceof most.Stream, true)
    assert.strictEqual(StreamAdapter.isValidStream(subject.stream), true)

    const observer1Expected = [1, 2, 3, 4]
    const observer2Expected = [3, 4]

    StreamAdapter.streamSubscribe(subject.stream, {
      next: (x) => assert.strictEqual(x, observer1Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer1Expected.length, 0)
    })

    subject.observer.next(1)
    subject.observer.next(2)

    StreamAdapter.streamSubscribe(subject.stream, {
      next: (x) => assert.strictEqual(x, observer2Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer2Expected.length, 0)
    })

    subject.observer.next(3)
    subject.observer.next(4)
    subject.observer.complete()

    setTimeout(done, 20)
  })
})
