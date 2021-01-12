import { Sinks } from '@cycle/run';
import {
  Operator,
  Producer,
  END,
  combine,
  pipe,
  map,
  flatten,
} from '@cycle/callbags';

export function pickMerge<U>(channel: string): Operator<Sinks[], U> {
  return instances$ => (_, sink) => {
    let instancesTalkback: any;
    let innerTalkbacks: Map<Producer<U>, any> = new Map();
    let prev: Set<Producer<U>> = new Set();
    let next: Set<Producer<U>> = new Set();
    let instancesEnded = false;

    const talkback = (_: END) => {
      instancesTalkback(2);
    };

    instances$(0, (t, d) => {
      if (t === 0) {
        instancesTalkback = d;
        sink(0, talkback);
      } else if (t === 1) {
        const sinkArray: Sinks[] = d;
        for (let i = 0; i < sinkArray.length; i++) {
          const stream = sinkArray[i][channel] as Producer<U>;

          if (!prev.has(stream)) {
            stream(0, (t2, d2) => {
              if (t2 === 0) {
                innerTalkbacks.set(stream, d2);
              } else if (t2 === 2 && d2) {
                innerTalkbacks.forEach((v, k) => {
                  if (k !== stream) v?.(2);
                });
                sink(2, d2);
              } else if (t2 === 2) {
                innerTalkbacks.delete(stream);
                if (instancesEnded && innerTalkbacks.size === 0) {
                  sink(2);
                }
              } else sink(t, d2);
            });
          }

          next.add(stream);
        }

        prev.forEach(x => {
          if (!next.has(x)) {
            innerTalkbacks.get(x)?.(2);
          }
        });

        const tmp = prev;
        tmp.clear();
        prev = next;
        next = tmp;
      } else if (t === 2 && d) {
        innerTalkbacks.forEach(v => v?.(2));
        sink(2, d);
      } else {
        if (innerTalkbacks.size === 0) sink(2);
        else instancesEnded = true;
      }
    });
  };
}

// TODO: avoid resubscribing just like with pickMerge
export function pickCombine<U>(channel: string): Operator<Sinks[], U[]> {
  return instances$ =>
    pipe(
      instances$,
      map(sinks => combine(...sinks.map((s: any) => s[channel]))),
      flatten
    );
}
