import xs, {Stream} from 'xstream';

const EXPECTED_DELTA = 1000 / 60;

type Frame = {
  delta: number;
  normalizedDelta: number;
  time: number;
}

function makeAnimationFrames (addFrameCallback, currentTime) {
  return function animationFrames (): Stream<Frame> {
    let frame = {
      time: 0,
      delta: 16,
      normalizedDelta: 1
    };

    let stopped = false;

    return xs.create<Frame>({
      start (listener) {
        frame.time = currentTime();

        function nextFrame () {
          if (stopped) {console.log('wow'); return; }

          const oldTime = frame.time;

          frame.time = currentTime();
          frame.delta = frame.time - oldTime;
          frame.normalizedDelta = frame.delta / EXPECTED_DELTA;

          listener.next(frame);

          addFrameCallback(nextFrame);
        };

        addFrameCallback(nextFrame);
      },

      stop () {
        stopped = true;
      }
    });
  }
}


export {
  makeAnimationFrames
}
