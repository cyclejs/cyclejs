import xs, {Stream} from 'xstream';
const makeAccumulator = require('sorted-immutable-list').default;
const requestAnimationFrame = require('raf');

import {makeDelay} from './delay';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';

const addScheduleEntry = makeAccumulator({
  key: entry => entry.time,
  unique: false
});

function timeDriver (_, streamAdapter) {
  let time = 0;
  let schedule = [];

  function scheduleEntry (newEntry) {
    schedule = addScheduleEntry(schedule, newEntry)

    return newEntry;
  }

  function currentTime () {
    return time;
  }

  function processEvent (eventTime) {
    time = eventTime;

    if (schedule.length === 0) {
      requestAnimationFrame(processEvent);

      return;
    }

    let nextEventTime = schedule[0].time;

    while (nextEventTime < time) {
      const eventToProcess = schedule.shift();

      if (!eventToProcess.cancelled) {
        if (eventToProcess.f) {
          eventToProcess.f(eventToProcess, time);
        }

        if (eventToProcess.type === 'next') {
          eventToProcess.stream.shamefullySendNext(eventToProcess.value);
        }

        if (eventToProcess.type === 'complete') {
          eventToProcess.stream.shamefullySendComplete();
        }

        nextEventTime = (schedule[0] && schedule[0].time) || Infinity;
      }
    }

    requestAnimationFrame(processEvent);
  }

  // TODO - cancel requestAnimationFrame on dispose
  requestAnimationFrame(processEvent);

  return {
    delay: makeDelay(scheduleEntry, currentTime),
    debounce: makeDebounce(scheduleEntry, currentTime),
    periodic: makePeriodic(scheduleEntry, currentTime),
    throttle: makeThrottle(scheduleEntry, currentTime),
  }
}

export {
  timeDriver
}
