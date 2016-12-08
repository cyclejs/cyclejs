import xs, {Stream} from 'xstream';

function makeDelay (scheduleEntry, currentTime) {
  return function delay (delayTime: number) {
    return function (stream: Stream<any>): Stream<any> {
      const outStream = xs.create();

      stream.addListener({
        next (event) {
          scheduleEntry({
            time: currentTime() + delayTime,
            value: event,
            stream: outStream,
            type: 'next'
          })
        },

        error (error) {
          scheduleEntry({
            time: currentTime() + delayTime,
            error,
            stream: outStream,
            type: 'error'
          })
        },

        complete () {
          scheduleEntry({
            time: currentTime() + delayTime,
            stream: outStream,
            type: 'complete'
          })
        }
      })

      return outStream;
    }
  }
}

export {
  makeDelay
}
