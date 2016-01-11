import assert from 'assert'
import Rx from 'rx'
import adapter from '../src'

describe('Cycle Rx Adapter', () => {

  it('should have replaySubject() function', done => {
    assert.strictEqual(typeof adapter.replaySubject, 'function')
    assert.doesNotThrow(() => {
      adapter.replaySubject()
    })
    done()
  })

  it('should have a dispose() function', done => {
    assert.strictEqual(typeof adapter.dispose, 'function')
    assert.doesNotThrow(() => {
      adapter.dispose({}, {}, {})
    })
    done()
  })

  it('should have a replicate() function', done => {
    assert.strictEqual(typeof adapter.replicate, 'function')
    assert.doesNotThrow(() => {
      const stream = new Rx.Subject()
      const sink = {
        add: x => stream.onNext(x),
        end: x => stream.onCompleted(x),
        error: x => stream.onEnd(x),
      }
      adapter.replicate(stream, sink)
    })
    done()
  })

  it('should have a isAdaptedStream() function', done => {
    assert.strictEqual(typeof adapter.isAdaptedStream, 'function')
    assert.doesNotThrow(() => {
      adapter.isAdaptedStream(Rx.Observable.just(100))
    })
    done()
  })

  it('should have error() function', done => {
    assert.strictEqual(typeof adapter.error, 'function')
    assert.throws(() => {
      adapter.error()
    }, /Stream provided is not a rx stream/i)
    done()
  })

  it('should have streamSubscription() function', done => {
    assert.strictEqual(typeof adapter.streamSubscription, 'function')
    assert.doesNotThrow(() => {
      const stream = new Rx.Subject()
      const sink = {
        add: x => stream.onNext(x),
        end: x => stream.onCompleted(x),
        error: x => stream.onEnd(x),
      }
      adapter.streamSubscription(stream, sink)
    })
    done()
  })

  it('should have adaptation() function', done => {
    assert.strictEqual(typeof adapter.adaptation, 'function')
    assert.doesNotThrow(() => {
      adapter.adaptation(Rx.Observable.just(100), adapter.streamSubscription)
    })
    done()
  })
})
