///<reference path="../custom-typings.d.ts" />
import {adapt} from '@cycle/run/lib/adapt';
import xs, {Stream} from 'xstream';
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
import * as combineErrors from 'combine-errors';

function raiseError(err: any) {
  if (err) {
    throw err;
  }
}

function finish(asserts: Array<any>, done: any) {
  const pendingAsserts = asserts.filter(assert => assert.state === 'pending');

  pendingAsserts.forEach(assert => assert.finish());

  const failedAsserts = asserts.filter(assert => assert.state === 'failed');

  const success = failedAsserts.length === 0;

  if (success) {
    done();
  } else {
    const errors = failedAsserts.map(assert => assert.error);
    const error = combineErrors(errors);

    const usingJasmine = 'fail' in done;

    if (usingJasmine) {
      done.fail(error);
    } else {
      done(error);
    }
  }
}

function mockTimeSource({interval = 20} = {}): any {
  let time = 0;
  let maxTime = 0;
  const asserts: Array<any> = [];
  let done: any;

  const scheduler = makeScheduler();

  function addAssert(assert: any) {
    asserts.push(assert);
  }

  function currentTime() {
    return time;
  }

  function setTime(newTime: number) {
    time = newTime;
  }

  function setMaxTime(newTime: number) {
    maxTime = Math.max(newTime, maxTime);
  }

  function createOperator() {
    return {schedule: scheduler.add, currentTime};
  }

  const timeSource = {
    diagram: makeDiagram(scheduler.add, currentTime, interval, setMaxTime),
    record: makeRecord(scheduler.add, currentTime, interval),
    assertEqual: makeAssertEqual(
      () => timeSource,
      scheduler.add,
      currentTime,
      interval,
      addAssert
    ),

    delay: makeDelay(createOperator),
    debounce: makeDebounce(createOperator),
    periodic: makePeriodic(createOperator),
    throttle: makeThrottle(createOperator),

    animationFrames: () => {
      const s = timeSource.periodic(16);

      if ('pipe' in s) {
        // This hack brought to you by the need to import rxjs's operators
        // and my desire to not force a dependency on rxjs
        return adapt(xs.fromObservable<number>(s).map(frame));
      }

      return s.map(frame);
    },
    throttleAnimation: makeThrottleAnimation(
      () => timeSource,
      scheduler.add,
      currentTime
    ),

    run(doneCallback = raiseError, timeToRunTo = 0) {
      done = doneCallback;
      if (!timeToRunTo) {
        timeToRunTo = maxTime;
      }
      runVirtually(
        scheduler,
        () => finish(asserts, done),
        currentTime,
        setTime,
        timeToRunTo
      );
    },

    createOperator,

    _scheduler: scheduler.add,
    _time: currentTime,
  };

  return timeSource;
}

function frame(i: number) {
  return {
    time: i * 16,
    delta: 16,
    normalizedDelta: 1,
  };
}

export {mockTimeSource};
