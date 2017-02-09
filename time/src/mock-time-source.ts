import xs, {Stream} from 'xstream';
import * as assert from 'assert';
import * as combineErrors from 'combine-errors';

import {makeScheduler} from './scheduler';
import {makeDelay} from './delay';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';
import {makeDiagram} from './diagram';
import {makeAssertEqual} from './assert-equal';
import {makeAnimationFrames} from './animation-frames';
import {makeThrottleAnimation} from './throttle-animation';
import {makeRecord} from './record';
import {runVirtually} from './run-virtually';
import {MockTimeSource} from './time-source';

function raiseError (err) {
  if (err) {
    throw err;
  }
}

function finish (asserts, done) {
  const pendingAsserts = asserts.filter(assert => assert.state === 'pending');

  if (pendingAsserts.length > 0) {
    pendingAsserts.forEach(assert => assert.finish());
  }

  const failedAsserts = asserts.filter(assert => assert.state === 'failed');

  const success = failedAsserts.length === 0;

  if (success) {
    done();
  } else {
    const errors = failedAsserts.map(assert => assert.error);
    const error = combineErrors(errors);

    done(error);
  }
}

function mockTimeSource ({interval = 20} = {}): MockTimeSource {
  let time = 0;
  let asserts = [];
  let done;

  const scheduler = makeScheduler();

  function addAssert (assert) {
    asserts.push(assert);
  }

  function currentTime () {
    return time;
  }

  function setTime (newTime) {
    time = newTime;
  }

  const timeSource = {
    diagram: makeDiagram(scheduler.add, currentTime, interval),
    record: makeRecord(scheduler.add, currentTime, interval),
    assertEqual: makeAssertEqual(() => timeSource, scheduler.add, currentTime, interval, addAssert),

    delay: makeDelay(scheduler.add, currentTime),
    debounce: makeDebounce(scheduler.add, currentTime),
    periodic: makePeriodic(scheduler.add, currentTime),
    throttle: makeThrottle(scheduler.add, currentTime),

    animationFrames: () => timeSource.periodic(16).map(frame),
    throttleAnimation: makeThrottleAnimation(() => timeSource, scheduler.add, currentTime),

    run (doneCallback = raiseError, timeToRunTo = null) {
      done = doneCallback;
      runVirtually(scheduler, () => finish(asserts, done), currentTime, setTime, timeToRunTo)
    },

    _scheduler: scheduler.add,
    _time: currentTime
  }

  return timeSource;
}

function frame (i) {
  return {
    time: i * 16,
    delta: 16,
    normalizedDelta: 1
  }
}

export {
  mockTimeSource
}
