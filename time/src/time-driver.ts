import xs, {Stream} from 'xstream';
import {makeScheduler} from './scheduler';
import {makeDelay} from './delay';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';
import {makeAnimationFrames} from './animation-frames';
import {makeThrottleAnimation} from './throttle-animation';
import {runVirtually} from './run-virtually';
import {TimeSource} from './time-source';
const requestAnimationFrame = require('raf');

function popAll(array: Array<any>): Array<any> {
  const poppedItems = [];

  while (array.length > 0) {
    poppedItems.push(array.pop());
  }

  return poppedItems;
}

function runRealtime(
  scheduler: any,
  frameCallbacks: any,
  currentTime: () => number,
  setTime: (t: number) => void,
) {
  let paused = false;
  const pause = () => (paused = true);
  const resume = (time: number) => {
    setTime(time);
    paused = false;
  };

  function processEvent(eventTime: number) {
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

function timeDriver(sink: any): any {
  let time = 0;
  const frameCallbacks: Array<any> = [];
  const scheduler = makeScheduler();

  function currentTime(): number {
    return time;
  }

  function setTime(newTime: number): void {
    time = newTime;
  }

  function addFrameCallback(callback: any) {
    frameCallbacks.push(callback);
  }

  // TODO - cancel requestAnimationFrame on dispose
  const {pause, resume} = runRealtime(
    scheduler,
    frameCallbacks,
    currentTime,
    setTime,
  );

  const timeSource = {
    animationFrames: makeAnimationFrames(addFrameCallback, currentTime),
    delay: makeDelay(scheduler.add, currentTime),
    debounce: makeDebounce(scheduler.add, currentTime),
    periodic: makePeriodic(scheduler.add, currentTime),
    throttle: makeThrottle(scheduler.add, currentTime),
    throttleAnimation: makeThrottleAnimation(
      () => timeSource,
      scheduler.add,
      currentTime,
    ),
    _time: currentTime,
    _scheduler: scheduler.add,
    _pause: pause,
    _resume: resume,
    _runVirtually: function(done: any, timeToRunTo: any) {
      // TODO - frameCallbacks?
      runVirtually(scheduler, done, currentTime, setTime, timeToRunTo);
    },
  };

  return timeSource;
}

export {timeDriver};
