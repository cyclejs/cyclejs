import xs, {Stream} from 'xstream';

function makePeriodic (schedule, currentTime) {
  return function periodic (period: number): Stream<number> {
    let stopped = false;

    function scheduleNextEvent (entry, time) {
      if (stopped) { return; }

      const value = entry.value + 1;

      schedule.next(entry.stream, currentTime() + period, value, scheduleNextEvent);
    };

    const producer = {
      listener: null,

      start (listener) {
        producer.listener = listener;

        schedule.next(listener, currentTime() + period, 0, scheduleNextEvent);
      },

      stop () {
        stopped = true;

        schedule.completion(producer.listener, currentTime())
      }
    };

    return xs.create<number>(producer);
  }
}

export {
  makePeriodic
}
