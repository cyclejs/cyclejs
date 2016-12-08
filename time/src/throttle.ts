import xs, {Stream} from 'xstream';

function makeThrottle (scheduleEntry, currentTime) {
  return function throttle (period: number) {
    return function throttleOperator (stream: Stream<any>): Stream<any> {
      const outStream = xs.create();
      let lastEventTime = -Infinity; // so that the first event is always scheduled

      stream.addListener({
        next (event) {
          const time = currentTime();

          const timeSinceLastEvent = time - lastEventTime;
          const throttleEvent = timeSinceLastEvent <= period;

          if (throttleEvent) {
            return;
          }

          scheduleEntry({
            time: time,
            value: event,
            stream: outStream,
            type: 'next'
          })

          lastEventTime = time;
        },

        error (error) {
          scheduleEntry({
            time: currentTime(),
            stream: outStream,
            error,
            type: 'error'
          })
        },

        complete () {
          scheduleEntry({
            time: currentTime(),
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
  makeThrottle
}
