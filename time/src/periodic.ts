import xs, {Stream} from 'xstream';

function makePeriodic (scheduleEntry, currentTime) {
  return function periodic (period: number): Stream<any> {
    let stopped = false;

    function scheduleNextEvent (entry, time) {
      if (stopped) {
        return;
      }

      scheduleEntry({
        time: currentTime() + period,
        value: entry.value + 1,
        stream: entry.stream,
        f: scheduleNextEvent,
        type: 'next'
      })
    }

    let _listener;

    const producer = {
      start (listener) {
        _listener = listener;

        scheduleEntry({
          time: currentTime() + period,
          value: 0,
          stream: listener,
          type: 'next',
          f: scheduleNextEvent
        })
      },

      stop () {
        stopped = true;

        scheduleEntry({
          time: currentTime(),
          stream: _listener,
          type: 'complete'
        })
      }
    }

    return xs.create(producer);
  }
}

export {
  makePeriodic
}
