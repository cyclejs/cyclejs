import {Listener} from 'xstream';
const makeAccumulator = require('sorted-immutable-list').default;

export interface Schedule<T> {
  shiftNextEntry(): T | undefined;
  isEmpty(): boolean;
  peek(): T | undefined;
  add: Scheduler<T>;
}

export type PostEventCallback<T> = (
  event: any,
  time: number,
  schedule: Scheduler<T>,
  currentTime: () => number,
) => void;

export interface Scheduler<T> {
  _schedule: any;

  next(
    listener: Listener<T>,
    time: number,
    value: T,
    callback?: PostEventCallback<T>,
  ): void;
  error(listener: Listener<T>, time: number, error: Error): void;
  complete(listener: Listener<T>, time: number): void;
}

const comparator = (a: any) => (b: any) => {
  if (a.time < b.time) {
    return -1;
  }

  if (a.time === b.time) {
    // In the case where a complete and next event occur in the same frame,
    // the next always comes before the complete

    if (a.stream === b.stream) {
      if (a.type === 'complete' && b.type === 'next') {
        return 1;
      }

      if (b.type === 'complete' && a.type === 'next') {
        return -1;
      }
    }
  }

  return 1;
};

function makeScheduler<T>(): Schedule<T> {
  let schedule: Array<any> = [];

  function getSchedule() {
    return schedule;
  }

  const addScheduleEntry = makeAccumulator({
    comparator,
    unique: false,
  });

  function scheduleEntry(newEntry: any) {
    schedule = addScheduleEntry(schedule, newEntry);

    return newEntry;
  }

  function noop() {}

  return {
    shiftNextEntry() {
      return schedule.shift();
    },

    isEmpty() {
      return schedule.length === 0;
    },

    peek() {
      return schedule[0];
    },

    add: {
      _schedule: getSchedule,

      next(stream: any, time: number, value: any, f = noop) {
        return scheduleEntry({
          type: 'next',
          stream,
          time,
          value,
          f,
        });
      },

      error(stream: any, time: number, error: any) {
        return scheduleEntry({
          type: 'error',
          stream,
          time,
          error,
        });
      },

      complete(stream: any, time: number) {
        return scheduleEntry({
          type: 'complete',
          stream,
          time,
        });
      },
    },
  };
}

export {makeScheduler};
