import { Producer } from '@cycle/callbags';

export function multicastNow<T>(source: Producer<T>): Producer<T> {
  let sinks: any[] = [];
  let lasts: T[] = [];

  let talkback: any;

  source(0, (t, d) => {
    if (t === 0) {
      talkback = d;
    } else {
      if (t === 1) {
        lasts.push(d);
        Promise.resolve().then(() => {
          lasts = [];
        });
      }

      let hasDeleted = false;
      for (const sink of sinks) {
        if (sink) sink(t, d);
        else hasDeleted = true;
      }

      if (hasDeleted) {
        sinks = sinks.filter(Boolean);
      }
    }
  });

  return (t, d) => {
    if (t === 0) {
      sinks.push(d);
      d(0, () => {
        sinks[sinks.indexOf(d)] = void 0;
        if (sinks.every(x => x === undefined)) {
          talkback(2);
          sinks = [];
        }
      });
      for (const x of lasts) {
        d(1, x);
      }
    } else if (t === 2) {
      talkback(2);
      sinks = [];
    }
  };
}
