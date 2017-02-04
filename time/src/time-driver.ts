import xs, {Stream} from 'xstream';
const requestAnimationFrame = require('raf');

import {makeScheduler} from './scheduler';
import {makeDelay} from './delay';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';
import {makeAnimationFrames} from './animation-frames';
import {makeThrottleAnimation} from './throttle-animation';

function popAll (array) {
  const poppedItems = [];

  while (array.length > 0) {
    poppedItems.push(array.pop());
  }

  return poppedItems;
}

function runRealtime (scheduler, frameCallbacks, currentTime, setTime) {
  function processEvent (eventTime) {
    const time = eventTime;
    setTime(time);

    const currentCallbacks = popAll(frameCallbacks);

    currentCallbacks.forEach(callback => callback(time));

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

  requestAnimationFrame(processEvent);
}


function timeDriver (_, streamAdapter) {
  let time = 0;
  let frameCallbacks = [];
  const scheduler = makeScheduler();

  function currentTime () {
    return time;
  }

  function setTime (newTime) {
    time = newTime;
  }

  function addFrameCallback (callback) {
    frameCallbacks.push(callback);
  }

  // TODO - cancel requestAnimationFrame on dispose
  runRealtime(scheduler, frameCallbacks, currentTime, setTime)

  const timeSource = {
    animationFrames: makeAnimationFrames(addFrameCallback, currentTime),
    delay: makeDelay(scheduler.add, currentTime),
    debounce: makeDebounce(scheduler.add, currentTime),
    periodic: makePeriodic(scheduler.add, currentTime),
    throttle: makeThrottle(scheduler.add, currentTime),
    throttleAnimation: makeThrottleAnimation(() => timeSource, scheduler.add, currentTime)
  }

  return timeSource;
}

export {
  timeDriver
}
