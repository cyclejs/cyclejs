const makeAccumulator = require('sorted-immutable-list').default;

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

function makeScheduler() {
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

      completion(stream: any, time: number) {
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
