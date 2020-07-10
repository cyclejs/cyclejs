import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';
import {OperatorArgs} from './types';

function makeDelayListener<T>(
  schedule: any,
  currentTime: () => number,
  delayTime: number,
  listener: any
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
    return function delayOperator<T>(inputStream: Stream<T>): Stream<T> {
      const stream = xs.fromObservable(inputStream);
      let delayListener: any = null;

      const producer = {
        start(listener: Listener<T>) {
          delayListener = makeDelayListener<T>(
            schedule,
            currentTime,
            delayTime,
            listener
          );

          stream.addListener(delayListener);
        },

        stop() {
          if (delayListener) {
            stream.removeListener(delayListener);
          }
        },
      };

      return adapt(xs.create<T>(producer));
    };
  };
}

export {makeDelay};
