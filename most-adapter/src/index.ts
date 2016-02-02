import {Stream, create} from 'most';
import {holdSubject} from 'most-subject';

// For TS Definitions
import {
  StreamAdapter,
  Observer,
  SinkProxies,
  StreamSubscribe,
  DisposeFunction,
  HoldSubject,
} from '@cycle/base';

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

const MostAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): Stream<T> {
    if (this.isValidStream(originStream)) {
      return originStream;
    }
    return create(
      (next: (x: any) => void, complete: (x: any) => void, error: (e: any) => void) => {
        const observer = {next, complete, error};
        const dispose = originStreamSubscribe(originStream, observer);
        return () => {
          if (typeof dispose === 'function') {
            (<DisposeFunction> dispose).call(null);
          }
        };
      }
    );
  },

  dispose(sinks: any, sinkProxies: SinkProxies, sources: any) {
    Object.keys(sources).forEach(k => {
      if (typeof sources[k].dispose === 'function') {
        sources[k].dispose();
      }
    });

    Object.keys(sinkProxies).forEach(k => {
      sinkProxies[k].observer.complete();
    });
  },

  makeHoldSubject(): HoldSubject {
    const {stream, observer: originObserver} = holdSubject();
    const {next, error: originError, complete} = originObserver;
    const observer = {
      next,
      error: (err: any) => {
        logToConsoleError(err);
        originError(err);
      },
      complete,
    };
    return {stream, observer};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.observe === 'function' &&
      typeof stream.drain === 'function');
  },

  streamSubscribe(stream: Stream<any>, observer: Observer) {
    stream.observe((x: any) => observer.next(x))
      .then((x: any) => observer.complete(x))
      .catch((e: Error) => observer.error(e));
  },
};

export default MostAdapter;
