import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

function makeDelayListener<T>(
  schedule: any,
  currentTime: () => number,
  delayTime: number,
  listener: any,
) {
  const delayedTime = () => currentTime() + delayTime;

  return {
    next(value: T) {
      schedule.next(listener, delayedTime(), value);
    },

    error(error: Error) {
      schedule.error(listener, delayedTime(), error);
    },

    complete() {
      schedule.completion(listener, delayedTime());
    },
  };
}

function makeDelay(schedule: any, currentTime: () => number) {
  return function delay(delayTime: number) {
    return function delayOperator<T>(stream: Stream<T>): Stream<T> {
      const producer = {
        start(listener: Listener<T>) {
          const delayListener = makeDelayListener<T>(
            schedule,
            currentTime,
            delayTime,
            listener,
          );

          xs.fromObservable(stream).addListener(delayListener);
        },

        stop() {},
      };

      return adapt(xs.create<T>(producer));
    };
  };
}

export {makeDelay};
