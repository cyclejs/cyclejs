import {ReplaySubject, Observable} from 'rx'

const streamTypeErrorMsg = lib => `Stream provided is not a ${lib} stream`

function logToConsoleError(err) {
  const target = err.stack || err
  if (console && console.error) {
    console.error(target)
  }
}

const rxAdapter = {
  replaySubject() {
    const stream = new ReplaySubject(1)
    const sink = {
      next: x => stream.onNext(x),
      complete: x => stream.onCompleted(x),
      error: x => stream.onError(x)
    }
    return {sink, stream}
  },

  dispose(sinks, sinkProxies, sources) {
    Object.keys(sources).forEach(k => {
      if (typeof sources[k].dispose === 'function') {
        sources[k].dispose()
      }
    })
    Object.keys(sinkProxies).forEach(k => {
      sinkProxies[k].sink.complete()
    })
  },

  replicate(stream, sink) {
    stream.subscribe(
      x => sink.next(x),
      x => {
        logToConsoleError(x)
        sink.error(x)
      },
      x => sink.complete(x)
    )
  },

  isValidStream(stream) {
    if (typeof stream.subscribe !== 'function' || //should have .subscribe
      typeof stream.onValue === `function`) // make sure not baconjs
    {
      return false
    }
    return true
  },

  error() {
    throw new Error(streamTypeErrorMsg('rx'))
  },

  streamSubscription(stream, sink) {
    stream.subscribe(
      x => sink.add(x),
      x => sink.error(x),
      x => sink.end(x)
    )
  },

  toAdapterStream(stream, streamSubscription) {
    if (rxAdapter.isValidStream(stream)) {
      return stream
    }
    return Observable.create(observer => {
      const sink = {
        add: x => observer.onNext(x),
        end: x => observer.onCompleted(x),
        error: x => observer.onEnd(x),
      }
      streamSubscription(stream, sink)
    })
  },
}

export default rxAdapter
