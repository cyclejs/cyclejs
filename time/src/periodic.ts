import xs, {Stream, Listener} from 'xstream';
import {adapt} from '@cycle/run/lib/adapt';

function makePeriodic(schedule: any, currentTime: () => number) {
  return function periodic(period: number): Stream<number> {
    let stopped = false;

    function scheduleNextEvent(
      entry: any,
      time: number,
      _schedule: any,
      _currentTime: () => number,
    ) {
      if (stopped) {
        return;
      }

      const value = entry.value + 1;

      _schedule.next(
        entry.stream,
        _currentTime() + period,
        value,
        scheduleNextEvent,
      );
    }

    const producer = {
      listener: null as (Listener<any> | null),

      start(listener: Listener<any>) {
        producer.listener = listener;
        schedule.next(listener, currentTime() + period, 0, scheduleNextEvent);
      },

      stop() {
        stopped = true;
        schedule.completion(producer.listener, currentTime());
      },
    };

    return adapt(xs.create<number>(producer));
  };
}

export {makePeriodic};
