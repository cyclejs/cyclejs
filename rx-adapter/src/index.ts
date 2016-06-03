import {
  StreamAdapter,
  Observer,
  SinkProxies,
  StreamSubscribe,
  DisposeFunction,
  Subject,
} from '@cycle/base';
const Rx = require('rx');

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

const RxJSAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): Rx.Observable<T> {
    if (this.isValidStream(originStream)) {
      return originStream;
    }
    return <Rx.Observable<T>> Rx.Observable.create((destinationObserver: any) => {
      const originObserver: Observer = {
        next: (x: T) => destinationObserver.onNext(x),
        error: (e: any) => destinationObserver.onError(e),
        complete: () => destinationObserver.onCompleted(),
      };
      const dispose = originStreamSubscribe(originStream, originObserver);
      return () => {
        if (typeof dispose === 'function') {
          (<DisposeFunction> dispose).call(null);
        }
      };
    });
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

  makeSubject(): Subject {
    const stream: Rx.Subject<any> = new Rx.Subject();
    const observer: Observer = {
      next: x => { stream.onNext(x); },
      error: err => {
        logToConsoleError(err);
        stream.onError(err);
      },
      complete: x => { stream.onCompleted(); },
    };
    return {stream, observer};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.subscribeOnNext === 'function' &&
      typeof stream.onValue !== 'function');
  },

  streamSubscribe(stream: Rx.Observable<any>, observer: Observer) {
    const subscription = stream.subscribe(
      (x: any) => observer.next(x),
      (e: any) => observer.error(e),
      () => observer.complete()
    );
    return () => {
      subscription.dispose();
    };
  },
};

export default RxJSAdapter;
