import {
  StreamAdapter,
  Observer,
  SinkProxies,
  StreamSubscribe,
  DisposeFunction,
  HoldSubject,
} from '@cycle/base';
import {Observable, ReplaySubject} from 'rxjs';

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

const RxJSAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): Observable<T> {
    if (this.isValidStream(originStream)) {
      return originStream;
    }
    return Observable.create((observer: Observer) => {
      const dispose = originStreamSubscribe(originStream, observer);
      return () => {
        if (typeof dispose === 'function') {
          (<DisposeFunction> dispose).call(null);
        }
      };
    });
  },

  dispose(sinks: any, sinkProxies: SinkProxies, sources: any) {
    Object.keys(sources).forEach(k => {
      if (typeof sources[k].unsubscribe === 'function') {
        sources[k].unsubscribe();
      }
    });
    Object.keys(sinkProxies).forEach(k => {
      sinkProxies[k].observer.complete();
    });
  },

  makeHoldSubject(): HoldSubject {
    const stream: ReplaySubject<any> = new ReplaySubject(1);
    const observer: Observer = {
      next: x => { stream.next(x); },
      error: err => {
        logToConsoleError(err);
        stream.error(err);
      },
      complete: x => { stream.complete(); },
    };
    return {stream, observer};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.subscribe === 'function' &&
      typeof stream.onValue !== 'function');
  },

  streamSubscribe(stream: Observable<any>, observer: Observer) {
    const subscription = stream.subscribe(<any> observer);
    return () => {
      subscription.unsubscribe();
    };
  },
};

export default RxJSAdapter;
