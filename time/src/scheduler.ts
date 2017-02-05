const makeAccumulator = require('sorted-immutable-list').default;

function makeScheduler () {
  let schedule = [];

  function getSchedule () {
    return schedule;
  }

  const addScheduleEntry = makeAccumulator({
    key: entry => entry.time,
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
