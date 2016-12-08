import xs, {Stream} from 'xstream';
import * as assert from 'assert';
const makeAccumulator = require('sorted-immutable-list').default;
const requestAnimationFrame = require('raf');

import {makeDelay} from './delay';
import {makeDiagram} from './diagram';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';
import {makeAssertEqual} from './assert-equal';

const addScheduleEntry = makeAccumulator({
  key: entry => entry.time,
  unique: false
});

function makeTimeDriver ({interval = 20} = {}) {
  return function timeDriver () {
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
}

function mockTimeSource ({interval = 20} = {}) {
  let time = 0;
  let schedule = [];

  function scheduleEntry (newEntry) {
    schedule = addScheduleEntry(schedule, newEntry)

    return newEntry;
  }

  function currentTime () {
    return time;
  }

  function processEvent () {
    const eventToProcess = schedule.shift();

    if (!eventToProcess) {
      return;
    }

    if (eventToProcess.cancelled) {
      setTimeout(processEvent);
      return;
    }

    time = eventToProcess.time;

    if (eventToProcess.f) {
      eventToProcess.f(eventToProcess, time);
    }

    if (eventToProcess.type === 'next') {
      eventToProcess.stream.shamefullySendNext(eventToProcess.value);
    }

    if (eventToProcess.type === 'error') {
      eventToProcess.stream.shamefullySendError(eventToProcess.error);
    }

    if (eventToProcess.type === 'complete') {
      eventToProcess.stream.shamefullySendComplete();
    }

    setTimeout(processEvent);
  }

  return {
    diagram: makeDiagram(scheduleEntry, currentTime, interval),
    assertEqual: makeAssertEqual(scheduleEntry, currentTime, interval),

    delay: makeDelay(scheduleEntry, currentTime),
    debounce: makeDebounce(scheduleEntry, currentTime),
    periodic: makePeriodic(scheduleEntry, currentTime),
    throttle: makeThrottle(scheduleEntry, currentTime),

    run () {
      setTimeout(processEvent);
    }
  }
}

export {
  makeTimeDriver,

  mockTimeSource
}
