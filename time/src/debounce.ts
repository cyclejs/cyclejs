import xs, {Stream} from 'xstream';

function makeDebounce (scheduleEntry, currentTime) {
  return function debounce (debounceInterval: number) {
    return function debounceOperator<T> (stream: Stream<T>): Stream<T> {
      let scheduledEntry = null;

      return xs.create<T>({
        start (listener) {
          stream.addListener({
            next (ev: T) {
              const timeToSchedule = currentTime() + debounceInterval;

              if (scheduledEntry) {
                const timeAfterPrevious = timeToSchedule - scheduledEntry.time;

                if (timeAfterPrevious <= debounceInterval) {
                  scheduledEntry.cancelled = true;
                }
              }

              scheduledEntry = scheduleEntry({
                type: 'next',
                value: ev,
                time: timeToSchedule,
                stream: listener
              });
            },

            error (error) {
              scheduleEntry({
                type: 'error',
                time: currentTime(),
                error,
                stream: listener
              })
            },

            complete () {
              scheduleEntry({
                type: 'complete',
                time: currentTime(),
                stream: listener
              })
            }
          });
        },

        // TODO - maybe cancel the scheduled event?
        stop () {}
      });
    }
  }
}

export {
  makeDebounce
}
