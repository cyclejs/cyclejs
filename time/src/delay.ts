import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {OperatorArgs} from './types';

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
      schedule.complete(listener, delayedTime());
    },
  };
}

function makeDelay(createOperator: () => OperatorArgs<any>) {
  const {schedule, currentTime} = createOperator();

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
