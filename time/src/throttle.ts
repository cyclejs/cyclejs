import xs, {Stream} from 'xstream';

function makeThrottle (scheduleEntry, currentTime) {
  return function throttle (period: number) {
    return function throttleOperator<T> (stream: Stream<T>): Stream<T> {
      let lastEventTime = -Infinity; // so that the first event is always scheduled

      return xs.create<T>({
        start (listener) {
          stream.addListener({
            next (event: T) {
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

              lastEventTime = time;
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
          })
        },

        stop () {
        }
      });
    }
  }
}

export {
  makeThrottle
}
