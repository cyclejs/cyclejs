import xs, {Stream} from 'xstream';
const requestAnimationFrame = require('raf');

import {makeScheduler} from './scheduler';
import {makeDelay} from './delay';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';
import {makeAnimationFrames} from './animation-frames';
import {makeThrottleAnimation} from './throttle-animation';
import {runVirtually} from './run-virtually';
import {TimeSource} from './time-source';

function popAll (array) {
  const poppedItems = [];

  while (array.length > 0) {
    poppedItems.push(array.pop());
  }

  return poppedItems;
}

function runRealtime (scheduler, frameCallbacks, currentTime, setTime) {
  let paused = false;
  const pause = () => paused = true;
  const resume = (time) => {
    setTime(time);
    paused = false;
  }

  function processEvent (eventTime) {
    if (paused) {
      requestAnimationFrame(processEvent);
      return;
    }

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
          eventToProcess.f(eventToProcess, time, scheduler.add, currentTime);
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

  return {pause, resume};
}


function timeDriver (_, streamAdapter): any {
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
  const {pause, resume} = runRealtime(scheduler, frameCallbacks, currentTime, setTime)

  const timeSource = {
    animationFrames: makeAnimationFrames(addFrameCallback, currentTime),
    delay: makeDelay(scheduler.add, currentTime),
    debounce: makeDebounce(scheduler.add, currentTime),
    periodic: makePeriodic(scheduler.add, currentTime),
    throttle: makeThrottle(scheduler.add, currentTime),
    throttleAnimation: makeThrottleAnimation(() => timeSource, scheduler.add, currentTime),
    _time: currentTime,
    _scheduler: scheduler.add,
    _pause: pause,
    _resume: resume,
    _runVirtually: function (done, timeToRunTo) {
      // TODO - frameCallbacks?
      runVirtually(scheduler, done, currentTime, setTime, timeToRunTo);
    }
  }

  return timeSource;
}

export {
  timeDriver
}
