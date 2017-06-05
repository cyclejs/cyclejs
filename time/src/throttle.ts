import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

function makeThrottleListener<T>(
  schedule: any,
  currentTime: () => number,
  period: number,
  listener: Listener<any>,
  state: any,
) {
  return {
    next(value: T) {
      const lastEventTime = state.lastEventTime;
      const time = currentTime();

      const timeSinceLastEvent = time - lastEventTime;
      const throttleEvent = timeSinceLastEvent <= period;

      if (throttleEvent) {
        return;
      }

      schedule.next(listener, time, value);

      state.lastEventTime = time;
    },

    error(error: any) {
      schedule.error(listener, currentTime(), error);
    },

    complete() {
      schedule.completion(listener, currentTime());
    },
  };
}

function makeThrottle(schedule: any, currentTime: () => number) {
  return function throttle(period: number) {
    return function throttleOperator<T>(stream: Stream<T>): Stream<T> {
      const state = {lastEventTime: -Infinity}; // so that the first event is always scheduled

      const throttledStream = xs.create<T>({
        start(listener) {
          const throttleListener = makeThrottleListener<T>(
            schedule,
            currentTime,
            period,
            listener,
            state,
          );

          xs.fromObservable(stream).addListener(throttleListener);
        },

        stop() {},
      });

      return adapt(throttledStream);
    };
  };
}

export {makeThrottle};
