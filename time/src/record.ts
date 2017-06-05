import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

function recordListener(currentTime: () => number, outListener: Listener<any>) {
  let entries: Array<any> = [];
  outListener.next(entries);

  return {
    next(ev: any) {
      entries = entries.concat({type: 'next', value: ev, time: currentTime()});
      outListener.next(entries);
    },

    error(error: any) {
      entries = entries.concat({type: 'error', time: currentTime(), error});

      outListener.next(entries);
      outListener.complete();
    },

    complete() {
      entries = entries.concat({type: 'complete', time: currentTime()});

      outListener.next(entries);
      outListener.complete();
    },
  };
}

function makeRecord(
  schedule: any,
  currentTime: () => number,
  interval: number,
) {
  return function record(stream: Stream<any>): Stream<any> {
    const recordedStream = xs.createWithMemory({
      start(listener) {
        xs
          .fromObservable(stream)
          .addListener(recordListener(currentTime, listener));
      },

      stop() {},
    });

    return adapt(recordedStream);
  };
}
export {makeRecord};
