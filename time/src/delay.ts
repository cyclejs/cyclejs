import xs, {Stream} from 'xstream';

function makeDelayListener<T> (scheduleEntry, currentTime, delayTime, listener) {
  return {
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
  }
}

function makeDelay (scheduleEntry, currentTime) {
  return function delay (delayTime: number) {
    return function delayOperator<T> (stream: Stream<T>): Stream<T> {
      const producer = {
        start (listener) {
          const delayListener = makeDelayListener<T>(
            scheduleEntry,
            currentTime,
            delayTime,
            listener
          );

          stream.addListener(delayListener);
        },

        stop () {}
      };

      return xs.create<T>(producer);
    }
  }
}

export {
  makeDelay
}
