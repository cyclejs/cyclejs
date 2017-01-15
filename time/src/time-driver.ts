import xs, {Stream} from 'xstream';
const requestAnimationFrame = require('raf');

import {makeScheduler} from './scheduler';
import {makeDelay} from './delay';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';

function timeDriver (_, streamAdapter) {
  let time = 0;
  const scheduler = makeScheduler();

  function currentTime () {
    return time;
  }

  function processEvent (eventTime) {
    time = eventTime;

    if (scheduler.isEmpty()) {
      requestAnimationFrame(processEvent);

      return;
    }

    let nextEventTime = scheduler.peek().time;

    while (nextEventTime < time) {
      const eventToProcess = scheduler.shiftNextEntry();

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
      }

      nextEventTime = (scheduler.peek() && scheduler.peek().time) || Infinity;
    }

    requestAnimationFrame(processEvent);
  }

  // TODO - cancel requestAnimationFrame on dispose
  requestAnimationFrame(processEvent);

  return {
    delay: makeDelay(scheduler.add, currentTime),
    debounce: makeDebounce(scheduler.add, currentTime),
    periodic: makePeriodic(scheduler.add, currentTime),
    throttle: makeThrottle(scheduler.add, currentTime),
  }
}

export {
  timeDriver
}
