const assert = require('assert')
const Rx = require('rx')
const adapter = require('../lib')

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

  it('should have a isValidStream() function', done => {
    assert.strictEqual(typeof adapter.isValidStream, 'function')
    assert.doesNotThrow(() => {
      adapter.isValidStream(Rx.Observable.just(100))
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

  it('should have toAdapterStream() function', done => {
    assert.strictEqual(typeof adapter.toAdapterStream, 'function')
    assert.doesNotThrow(() => {
      adapter.toAdapterStream(Rx.Observable.just(100), adapter.streamSubscription)
    })
    done()
  })
})
