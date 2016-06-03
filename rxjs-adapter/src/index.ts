import {
  StreamAdapter,
  Observer,
  SinkProxies,
  StreamSubscribe,
  DisposeFunction,
  Subject,
} from '@cycle/base';
import * as Rx from 'rxjs';

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

function attemptSubjectComplete<T>(subject: Rx.Subject<T>): void {
  try {
    subject.complete();
  } catch (err) {
    return void 0;
  }
}

const RxJSAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): Rx.Observable<T> {
    if (this.isValidStream(originStream)) {
      return originStream;
    }
    return Rx.Observable.create((observer: Observer) => {
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
      attemptSubjectComplete(<Rx.Subject<any>> sinkProxies[k].observer);
    });
  },

  makeSubject(): Subject {
    const stream: Rx.Subject<any> = new Rx.Subject();
    const observer: Rx.Observer<any> = {
      next: x => { stream.next(x); },
      error: err => {
        logToConsoleError(err);
        stream.error(err);
      },
      complete: () => { stream.complete(); },
    };
    return {stream, observer};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.subscribe === 'function' &&
      typeof stream.subscribeOnNext !== 'function' &&
      typeof stream.onValue !== 'function');
  },

  streamSubscribe(stream: Rx.Observable<any>, observer: Observer) {
    const subscription = stream.subscribe(<any> observer);
    return () => {
      subscription.unsubscribe();
    };
  },
};

export default RxJSAdapter;
