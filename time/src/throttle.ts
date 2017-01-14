import xs, {Stream} from 'xstream';

function makeThrottleListener<T> (scheduleEntry, currentTime, period, listener, state) {
  return {
    next (event: T) {
      const lastEventTime = state.lastEventTime;
      const time = currentTime();

      const timeSinceLastEvent = time - lastEventTime;
      const throttleEvent = timeSinceLastEvent <= period;

      if (throttleEvent) {
        return;
      }

      scheduleEntry({
        time: time,
        value: event,
        stream: listener,
        type: 'next'
      })

      state.lastEventTime = time;
    },

    error (error) {
      scheduleEntry({
        time: currentTime(),
        stream: listener,
        error,
        type: 'error'
      })
    },

    complete () {
      scheduleEntry({
        time: currentTime(),
        stream: listener,
        type: 'complete'
      })
    }
  }
}

function makeThrottle (scheduleEntry, currentTime) {
  return function throttle (period: number) {
    return function throttleOperator<T> (stream: Stream<T>): Stream<T> {
      const state = {lastEventTime: -Infinity}; // so that the first event is always scheduled

      return xs.create<T>({
        start (listener) {
          const throttleListener = makeThrottleListener<T>(
            scheduleEntry,
            currentTime,
            period,
            listener,
            state
          );

          stream.addListener(throttleListener)
        },

        stop () {}
      });
    }
  }
}

export {
  makeThrottle
}
