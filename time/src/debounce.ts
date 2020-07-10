import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {OperatorArgs} from './types';

function makeDebounceListener<T>(
  schedule: any,
  currentTime: () => number,
  debounceInterval: number,
  listener: any,
  state: any
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
      if (state.scheduledEntry) {
        state.scheduledEntry.cancelled = true;
      }
      listener.error(e);
    },

    complete() {
      if (state.scheduledEntry) {
        state.scheduledEntry.cancelled = true;
      }
      listener.complete();
    },
  };
}

function makeDebounce(createOperator: () => OperatorArgs<any>) {
  const {schedule, currentTime} = createOperator();

  return function debounce(debounceInterval: number) {
    return function debounceOperator<T>(inputStream: Stream<T>): Stream<T> {
      const state = {scheduledEntry: null};
      const stream = xs.fromObservable(inputStream);
      let debounceListener: any = null;

      const debouncedStream = xs.create<T>({
        start(listener: Listener<T>) {
          debounceListener = makeDebounceListener<T>(
            schedule,
            currentTime,
            debounceInterval,
            listener,
            state
          );

          stream.addListener(debounceListener);
        },

        stop() {
          if (debounceListener) {
            stream.removeListener(debounceListener);
          }
        },
      });

      return adapt(debouncedStream);
    };
  };
}

export {makeDebounce};
