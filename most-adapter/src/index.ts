import {
  StreamAdapter,
  Observer,
  SinkProxies,
  StreamSubscribe,
  DisposeFunction,
  HoldSubject,
} from '@cycle/base';

import {Stream} from 'most';
import {subject, holdSubject} from 'most-subject';

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

const MostAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): any {
    if (MostAdapter.isValidStream(originStream)) { return originStream; };
    let dispose: any;
    const stream = subject<T>();

    dispose = originStreamSubscribe(originStream, {
      next: (x: T) => stream.next(x),
      error: (err: Error) => stream.error(err),
      complete: (x?: T) => {
        stream.complete(x);
        if (typeof dispose === 'function') {
          <DisposeFunction> dispose();
        }
      }
    });

    return stream;
  },

  dispose(sinks: any, sinkProxies: SinkProxies, sources: any) {
    Object.keys(sinkProxies).forEach(k => {
      sinkProxies[k].observer.complete();
    });
  },

  makeHoldSubject<T>(): HoldSubject {
    const stream = holdSubject<T>();

    const observer = {
      next: (x: T) => { stream.next(x); },
      error: (err: Error) => {
        logToConsoleError(err);
        stream.error(err);
      },
      complete: (x?: T) => { stream.complete(x); }
    };

    return {observer, stream};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.drain === 'function' &&
      typeof stream.subscribe === 'function');
  },

  streamSubscribe(stream: Stream<any>, observer: Observer) {
    const subscription = stream.subscribe(observer);
    return () => subscription.unsubscribe();
  }
};

export default MostAdapter;
