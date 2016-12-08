import xs, {Stream} from 'xstream';

function makeDebounce (scheduleEntry, currentTime) {
  return function debounce (debounceInterval: number) {
    return function debounceOperator (stream: Stream<any>): Stream<any> {
      const outStream = xs.create();
      let scheduledEntry = null;

      stream.addListener({
        next (ev) {
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
            stream: outStream
          });
        },

        error (error) {
          scheduleEntry({
            type: 'error',
            time: currentTime(),
            error,
            stream: outStream
          })
        },

        complete () {
          scheduleEntry({
            type: 'complete',
            time: currentTime(),
            stream: outStream
          })
        }
      });

      return outStream;
    }
  }
}

export {
  makeDebounce
}
