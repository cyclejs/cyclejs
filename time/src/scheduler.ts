const makeAccumulator = require('sorted-immutable-list').default;

const comparator = (a) => (b) => {
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

function makeScheduler () {
  let schedule = [];

  function getSchedule () {
    return schedule;
  }

  const addScheduleEntry = makeAccumulator({
    comparator,
    unique: false
  });

  function scheduleEntry (newEntry) {
    schedule = addScheduleEntry(schedule, newEntry)

    return newEntry;
  }

  function noop () {}

  return {
    shiftNextEntry () {
      return schedule.shift();
    },

    isEmpty () {
      return schedule.length === 0;
    },

    peek () {
      return schedule[0];
    },

    add: {
      _schedule: getSchedule,

      next (stream, time, value, f = noop) {
        return scheduleEntry({
          type: 'next',
          stream,
          time,
          value,
          f
        })
      },

      error (stream, time, error) {
        return scheduleEntry({
          type: 'error',
          stream,
          time,
          error
        })
      },

      completion (stream, time) {
        return scheduleEntry({
          type: 'complete',
          stream,
          time
        })
      }
    }
  }
}

export {
  makeScheduler
}
