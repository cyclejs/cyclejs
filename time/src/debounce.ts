import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

function makeDebounceListener<T>(
  schedule: any,
  currentTime: () => number,
  debounceInterval: number,
  listener: any,
  state: any,
) {
  return {
    next(value: T) {
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

    error(e: any) {
      schedule.error(listener, currentTime(), e);
    },

    complete() {
      schedule.completion(listener, currentTime());
    },
  };
}

function makeDebounce(schedule: any, currentTime: () => number) {
  return function debounce(debounceInterval: number) {
    return function debounceOperator<T>(stream: Stream<T>): Stream<T> {
      const state = {scheduledEntry: null};

      const debouncedStream = xs.create<T>({
        start(listener: Listener<T>) {
          const debounceListener = makeDebounceListener<T>(
            schedule,
            currentTime,
            debounceInterval,
            listener,
            state,
          );

          xs.fromObservable(stream).addListener(debounceListener);
        },

        // TODO - maybe cancel the scheduled event?
        stop() {},
      });

      return adapt(debouncedStream);
    };
  };
}

export {makeDebounce};
