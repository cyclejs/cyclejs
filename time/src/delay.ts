import xs, {Stream} from 'xstream';

function makeDelay (scheduleEntry, currentTime) {
  return function delay (delayTime: number) {
    return function delayOperator<T> (stream: Stream<T>): Stream<T> {
      return xs.create<T>({
        start (listener) {
          stream.addListener({
            next (event: T) {
              scheduleEntry({
                time: currentTime() + delayTime,
                value: event,
                stream: listener,
                type: 'next'
              })
            },

            error (error: Error) {
              scheduleEntry({
                time: currentTime() + delayTime,
                error,
                stream: listener,
                type: 'error'
              })
            },

            complete () {
              scheduleEntry({
                time: currentTime() + delayTime,
                stream: listener,
                type: 'complete'
              })
            }
          })
        },

        stop () {}
      });
    }
  }
}

export {
  makeDelay
}
