import {subject, holdSubject} from 'most-subject'

function logToConsoleError (err) {
  const target = err.stack || err
  if (console && console.error) {
    console.error(target)
  } else if (console && console.log) {
    console.log(target)
  }
}

const MostAdapter = {
  adapt (originStream, originStreamSubscribe) {
    if (this.isValidStream(originStream)) { return originStream }
    const stream = subject()

    const dispose = originStreamSubscribe(originStream, {
      next: x => stream.next(x),
      error: err => stream.error(err),
      complete: x => {
        stream.complete(x)
        if (typeof dispose === 'function') {
          dispose()
        }
      }
    })

    return stream
  },

  dispose (sinks, sinkProxies, sources) {
    Object.keys(sinkProxies).forEach(k => {
      sinkProxies[k].observer.complete()
    })
  },

  makeHoldSubject () {
    const stream = holdSubject()
    const observer = {
      next: x => stream.next(x),
      error: err => {
        logToConsoleError(err)
        stream.error(err)
      },
      complete: x => stream.complete(x)
    }
    return {stream, observer}
  },

  isValidStream (stream) {
    return (
      typeof stream.observe === 'function' &&
      typeof stream.drain === 'function')
  },

  streamSubscribe (stream, observer) {
    stream.observe(x => observer.next(x))
      .then(x => observer.complete(x))
      .catch(e => observer.error(e))
  }
}

export default MostAdapter
