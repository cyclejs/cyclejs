import { Sinks } from '@cycle/run';
import { Operator, Producer, END } from '@cycle/callbags';

export const noop = Symbol('pickNoop');

export function pickMerge<U>(channel: string): Operator<Sinks[], U> {
  return pick(channel, arg => arg);
}

export function pickCombine<U>(channel: string): Operator<Sinks[], U[]> {
  return pickCombineWith(channel, (...args) => args);
}

export function pickCombineWith<U>(
  channel: string,
  f: (...args: any[]) => U
): Operator<Sinks[], U> {
  const empty = {};
  let data: any[] = [];
  let sinks: Sinks[] = [];
  let numStarted = 0;

  const onNewSinks = (s: Sinks[]) => {
    const newData = Array(s.length).fill(empty);

    for (let i = 0; i < s.length; i++) {
      if (sinks[i] !== s[i]) {
        for (let j = 0; j < sinks.length; j++) {
          if (sinks[j] === s[i]) {
            newData[i] = data[j];
          }
        }
      } else {
        newData[i] = data[i];
      }
    }

    numStarted = 0;
    for (const x of newData) {
      if (x !== empty) numStarted++;
    }

    data = newData;
    sinks = s;
  };

  const onSinkData = (arg: any, i: number) => {
    if (data[i] === empty) numStarted++;
    data[i] = arg;

    if (numStarted === sinks.length) {
      return f(...data);
    } else return noop;
  };

  return pick(channel, onSinkData, onNewSinks);
}

export function pick<U>(
  channel: string,
  onSinkData: (arg: any, i: number) => U | typeof noop,
  onNewSinks?: (sinkArray: Sinks[]) => void
): Operator<Sinks[], U> {
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
        onNewSinks?.(sinkArray);

        for (let i = 0; i < sinkArray.length; i++) {
          const stream = sinkArray[i][channel] as Producer<U>;
          if (!stream) continue;

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
              } else if (t === 1) {
                const data = onSinkData(d2, i);
                if (data !== noop) sink(1, data);
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
