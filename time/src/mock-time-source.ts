import xs, {Stream} from 'xstream';
import * as assert from 'assert';
import * as combineErrors from 'combine-errors';
require('setimmediate');

import {makeScheduler} from './scheduler';
import {makeDelay} from './delay';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';
import {makeDiagram} from './diagram';
import {makeAssertEqual} from './assert-equal';

function raiseError (err) {
  if (err) {
    throw err;
  }
}

function mockTimeSource ({interval = 20} = {}) {
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

  function processEvent () {
    const eventToProcess = scheduler.shiftNextEntry();

    if (!eventToProcess) {
      const pendingAsserts = asserts.filter(assert => assert.state === 'pending');

      if (pendingAsserts.length > 0) {
        pendingAsserts.forEach(assert => assert.finish());
      }

      const failedAsserts = asserts.filter(assert => assert.state === 'failed');

      if (failedAsserts.length > 0) {
        const errors = failedAsserts.map(assert => assert.error);
        const error = combineErrors(errors);

        done(error);
      } else {
        done();
      }

      return;
    }

    if (eventToProcess.cancelled) {
      setImmediate(processEvent);
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

    setImmediate(processEvent);
  }

  return {
    diagram: makeDiagram(scheduler.add, currentTime, interval),
    assertEqual: makeAssertEqual(scheduler.add, currentTime, interval, addAssert),

    delay: makeDelay(scheduler.add, currentTime),
    debounce: makeDebounce(scheduler.add, currentTime),
    periodic: makePeriodic(scheduler.add, currentTime),
    throttle: makeThrottle(scheduler.add, currentTime),

    run (doneCallback = raiseError) {
      done = doneCallback;
      setImmediate(processEvent);
    }
  }
}

export {
  mockTimeSource
}
