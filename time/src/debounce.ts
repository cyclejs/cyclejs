import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

function makeDebounceListener<T> (schedule, currentTime, debounceInterval, listener, state) {
  return {
    next (value: T) {
      const scheduledEntry = state.scheduledEntry;
      const timeToSchedule = currentTime() + debounceInterval;

      if (scheduledEntry) {
        const timeAfterPrevious = timeToSchedule - scheduledEntry.time;

        if (timeAfterPrevious <= debounceInterval) {
          scheduledEntry.cancelled = true;
        }
      }

      state.scheduledEntry = schedule.next(listener, timeToSchedule, value);
    },

    error (error) {
      schedule.error(listener, currentTime(), error);
    },

    complete () {
      schedule.completion(listener, currentTime());
    }
  }
}

function makeDebounce (schedule, currentTime) {
  return function debounce (debounceInterval: number) {
    return function debounceOperator<T> (stream: Stream<T>): Stream<T> {
      const state = {scheduledEntry: null};

      return adapt(xs.create<T>({
        start (listener) {
          const debounceListener = makeDebounceListener<T>(
            schedule,
            currentTime,
            debounceInterval,
            listener,
            state
          );

          xs.fromObservable(stream).addListener(debounceListener);
        },

        // TODO - maybe cancel the scheduled event?
        stop () {}
      }));
    }
  }
}

export {
  makeDebounce
}
