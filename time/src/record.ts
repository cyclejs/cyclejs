import xs, {Stream} from 'xstream';

function recordListener (currentTime, outListener) {
  let entries = [];
  outListener.next(entries);

  return {
    next (ev) {
      entries = entries.concat({type: 'next', value: ev, time: currentTime()});
      outListener.next(entries);
    },

    complete () {
      entries = entries.concat({type: 'complete', time: currentTime()});

      outListener.next(entries);
      outListener.complete();
    },

    error (error) {
      entries = entries.concat({type: 'error', time: currentTime(), error});

      outListener.next(entries);
      outListener.complete();
    }
  }
}

function makeRecord (schedule, currentTime, interval) {
  return function record (stream: Stream<any>): Stream<any> {
    return xs.createWithMemory({
      start (listener) {
        stream.addListener(recordListener(currentTime, listener));
      },

      stop () {
      }
    });
  }
}
export {
  makeRecord
}
