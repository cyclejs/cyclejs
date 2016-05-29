import {describe, it} from 'mocha'
import assert from 'power-assert'
import StreamAdapter from '../lib/index'
import most from 'most'

describe('StreamAdapter', () => {
  it('should conform to StreamLibrary interface', () => {
    assert.strictEqual(typeof StreamAdapter, 'object')
    assert.strictEqual(typeof StreamAdapter.adapt, 'function')
    assert.strictEqual(typeof StreamAdapter.dispose, 'function')
    assert.strictEqual(typeof StreamAdapter.makeHoldSubject, 'function')
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

  it('should create a hold subject which can be fed and subscribed to', (done) => {
    const holdSubject = StreamAdapter.makeHoldSubject()
    assert.strictEqual(holdSubject.stream instanceof most.Stream, true)
    assert.strictEqual(StreamAdapter.isValidStream(holdSubject.stream), true)

    const observer1Expected = [1, 2, 3, 4]
    const observer2Expected = [2, 3, 4]

    StreamAdapter.streamSubscribe(holdSubject.stream, {
      next: (x) => assert.strictEqual(x, observer1Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer1Expected.length, 0)
    })

    holdSubject.observer.next(1)
    holdSubject.observer.next(2)

    StreamAdapter.streamSubscribe(holdSubject.stream, {
      next: (x) => assert.strictEqual(x, observer2Expected.shift()),
      error: done,
      complete: () => assert.strictEqual(observer2Expected.length, 0)
    })

    holdSubject.observer.next(3)
    holdSubject.observer.next(4)
    holdSubject.observer.complete()

    setTimeout(done, 20)
  })
})
