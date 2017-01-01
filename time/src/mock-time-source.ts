import xs, {Stream} from 'xstream';
import * as assert from 'assert';
require('setimmediate');
const makeAccumulator = require('sorted-immutable-list').default;

import {makeDelay} from './delay';
import {makeDebounce} from './debounce';
import {makePeriodic} from './periodic';
import {makeThrottle} from './throttle';
import {makeDiagram} from './diagram';
import {makeAssertEqual} from './assert-equal';

const addScheduleEntry = makeAccumulator({
  key: entry => entry.time,
  unique: false
});

function raiseError (err) {
  if (err) {
    throw err;
  }
}

function mockTimeSource ({interval = 20} = {}) {
  let time = 0;
  let schedule = [];
  let asserts = [];
  let done;

  function scheduleEntry (newEntry) {
    schedule = addScheduleEntry(schedule, newEntry)

    return newEntry;
  }

  function addAssert (assert) {
    asserts.push(assert);
  }

  function currentTime () {
    return time;
  }

  function processEvent () {
    const eventToProcess = schedule.shift();

    if (!eventToProcess) {
      const failedAsserts = asserts.filter(assert => assert.state === 'failed');
      const pendingAsserts = asserts.filter(assert => assert.state === 'pending');

      if (pendingAsserts.length > 0) {
        console.log('Pending asserts after run finished: ', pendingAsserts);
      }

      if (failedAsserts.length > 0) {
        done(failedAsserts[0].error);
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
    diagram: makeDiagram(scheduleEntry, currentTime, interval),
    assertEqual: makeAssertEqual(scheduleEntry, currentTime, interval, addAssert),

    delay: makeDelay(scheduleEntry, currentTime),
    debounce: makeDebounce(scheduleEntry, currentTime),
    periodic: makePeriodic(scheduleEntry, currentTime),
    throttle: makeThrottle(scheduleEntry, currentTime),

    run (doneCallback = raiseError) {
      done = doneCallback;
      setImmediate(processEvent);
    }
  }
}

export {
  mockTimeSource
}
