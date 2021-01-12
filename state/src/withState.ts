import type { MasterWrapper } from '@cycle/run';
import {
  pipe,
  merge,
  subscribe,
  never,
  scan,
  skip,
  Subject,
  ALL,
} from '@cycle/callbags';

import { StateApi, dropRepeats } from './api';

function makeReplaySubject<T>(): Subject<T> {
  let sinks: Array<any | undefined> = [];
  let buffer1: Array<T> = [];
  let buffer2: Array<T> = [];
  let bufferLength = 0;
  let promise: Promise<void> | undefined;

  const scheduleData = () =>
    Promise.resolve().then(() => {
      // We use two buffers to avoid allocating new arrays all the time
      const tmp = buffer2;
      const bufLen = bufferLength;
      buffer2 = buffer1;
      buffer1 = tmp;
      bufferLength = 0;

      let hasDeleted = false;

      for (let i = 0; i < bufLen; i++) {
        for (let j = 0; j < sinks.length; j++) {
          if (sinks[j]) sinks[j](1, buffer2[i]);
          else hasDeleted = true;
        }
      }

      if (hasDeleted) {
        sinks = sinks.filter(Boolean);
      }

      if (bufferLength > 0) {
        promise = scheduleData();
      } else promise = void 0;
    });

  return (type: ALL, data: unknown) => {
    if (type === 0) {
      const sink = data as any;
      sinks.push(sink);
      sink(0, () => {
        const i = sinks.indexOf(sink);
        sinks[i] = void 0;
      });
      if (!promise) {
        promise = scheduleData();
      }
    } else if (type === 1) {
      buffer1[bufferLength++] = data as T;
      if (!promise) {
        promise = scheduleData();
      }
    } else {
      for (const sink of sinks) {
        sink?.(type, data);
      }
    }
  };
}

export function withState(channel = 'state'): MasterWrapper {
  return (main, errorHandler) => sources => {
    const subject = makeReplaySubject();

    const api = new StateApi(subject, errorHandler);

    const sinks = main({ ...sources, [channel]: api });

    if (sinks[channel]) {
      pipe(
        merge(sinks[channel], never()),
        scan((state, reducer: any) => reducer(state), undefined),
        skip(1),
        dropRepeats(),
        subscribe(
          x => subject(1, x),
          e => subject(2, e)
        )
      );
    }
  };
}
