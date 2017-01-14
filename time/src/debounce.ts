import xs, {Stream} from 'xstream';

function makeDebounceListener<T> (scheduleEntry, currentTime, debounceInterval, listener, state) {
  return {
    next (ev: T) {
      const scheduledEntry = state.scheduledEntry;
      const timeToSchedule = currentTime() + debounceInterval;

      if (scheduledEntry) {
        const timeAfterPrevious = timeToSchedule - scheduledEntry.time;

        if (timeAfterPrevious <= debounceInterval) {
          scheduledEntry.cancelled = true;
        }
      }

      state.scheduledEntry = scheduleEntry({
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
  }
}

function makeDebounce (scheduleEntry, currentTime) {
  return function debounce (debounceInterval: number) {
    return function debounceOperator<T> (stream: Stream<T>): Stream<T> {
      const state = {scheduledEntry: null};

      return xs.create<T>({
        start (listener) {
          const debounceListener = makeDebounceListener<T>(
            scheduleEntry,
            currentTime,
            debounceInterval,
            listener,
            state
          );

          stream.addListener(debounceListener);
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
