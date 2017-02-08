import xs, {Stream} from 'xstream';
import sampleCombine from 'xstream/extra/sampleCombine';
import {adapt} from '@cycle/run/lib/adapt';

function makeThrottleAnimation (timeSource, schedule, currentTime) {
  return function throttleAnimation<T> (stream: Stream<T>): Stream<T> {
    const source = timeSource();

    return adapt(xs.create<T>({
      start (listener) {
        let lastValue = null;
        let emittedLastValue = true;
        const frame$ = source.animationFrames();

        const animationListener = {
          next (event) {
            if (!emittedLastValue) {
              schedule.next(listener, currentTime(), lastValue);
            }
          }
        }

        xs.fromObservable(stream).addListener({
          next (event: T) {
            lastValue = event;
            emittedLastValue = false;
          },

          error (err: Error) {
            schedule.error(listener, currentTime(), err);
          },

          complete () {
            frame$.removeListener(animationListener);
            schedule.completion(listener, currentTime());
          }
        });

        frame$.addListener(animationListener);
      },

      stop () {}
    }));
  }
}

export {
  makeThrottleAnimation
}
