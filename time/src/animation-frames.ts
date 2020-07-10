import xs, {Stream} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

const EXPECTED_DELTA = 1000 / 60;

export type Frame = {
  delta: number;
  normalizedDelta: number;
  time: number;
};

function makeAnimationFrames(addFrameCallback: any, currentTime: () => number) {
  return function animationFrames(): Stream<Frame> {
    const frame = {
      time: 0,
      delta: 16,
      normalizedDelta: 1,
    };

    let stopped = false;

    const frameStream = xs.create<Frame>({
      start(listener) {
        frame.time = currentTime();

        function nextFrame() {
          if (stopped) {
            return;
          }

          const oldTime = frame.time;

          frame.time = currentTime();
          frame.delta = frame.time - oldTime;
          frame.normalizedDelta = frame.delta / EXPECTED_DELTA;

          listener.next(frame);

          addFrameCallback(nextFrame);
        }

        addFrameCallback(nextFrame);
      },

      stop() {
        stopped = true;
      },
    });

    return adapt(frameStream);
  };
}

export {makeAnimationFrames};
