import { Producer } from '@cycle/callbags';

export function multicastNow<T>(source: Producer<T>): Producer<T> {
  let sinks: any[] = [];
  let last: any = undefined;
  let hasLast = false;

  let talkback: any;

  source(0, (t, d) => {
    if (t === 0) {
      talkback = d;
    } else {
      if (t === 1) {
        Promise.resolve().then(() => {
          hasLast = false;
          last = void 0;
        });

        last = d;
        hasLast = true;
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

  return (_, sink) => {
    sinks.push(sink);
    sink(0, () => {
      sinks[sinks.indexOf(sink)] = void 0;
      if (sinks.every(x => x === undefined)) {
        talkback(2);
        sinks = [];
      }
    });
    if (hasLast) {
      sink(1, last);
    }
  };
}
