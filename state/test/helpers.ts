import { Operator } from '@cycle/callbags';

export function delay<T>(ms: number): Operator<T, T> {
  return source => (_, sink) => {
    source(0, (t, d) => {
      if (t === 0) sink(t, d);
      else {
        setTimeout(() => {
          sink(t, d);
        }, ms);
      }
    });
  };
}

export function unsubscribeEarly<T>(
  when: (t: number) => boolean
): Operator<T, T> {
  return source => (_, sink) => {
    let talkback: any;
    source(0, (t, d) => {
      if (t === 0) talkback = d;
      if (when(t)) {
        talkback(2);
        sink(2);
      }
      sink(t, d);
    });
  };
}
