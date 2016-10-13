import {
  StreamAdapter,
  Observer,
  StreamSubscribe,
  DisposeFunction,
  Subject,
} from '@cycle/base';
import Rx = require('rx');

const RxJSAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): Rx.Observable<T> {
    if (this.isValidStream(originStream)) {
      return originStream;
    }
    return Rx.Observable.create((destinationObserver: any) => {
      const originObserver: Observer<T> = {
        next: (x: T) => destinationObserver.onNext(x),
        error: (e: any) => destinationObserver.onError(e),
        complete: () => destinationObserver.onCompleted(),
      };
      const dispose = originStreamSubscribe(originStream, originObserver);
      return () => {
        if (typeof dispose === 'function') {
          (dispose as DisposeFunction).call(null);
        }
      };
    }) as Rx.Observable<T>;
  },

  remember<T>(observable: Rx.Observable<T>): Rx.Observable<T> {
    return observable.shareReplay(1);
  },

  makeSubject<T>(): Subject<T> {
    const stream: Rx.Subject<any> = new Rx.Subject();
    const observer: Observer<T> = {
      next: (x: T) => { stream.onNext(x); },
      error: (err: any) => { stream.onError(err); },
      complete: (x?: T) => { stream.onCompleted(); },
    };
    return {stream, observer};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.subscribeOnNext === 'function' &&
      typeof stream.onValue !== 'function');
  },

  streamSubscribe <T>(stream: Rx.Observable<any>, observer: Observer<T>) {
    const subscription = stream.subscribe(
      (x: T) => observer.next(x),
      (e: any) => observer.error(e),
      (x?: T) => observer.complete(x),
    );
    return () => {
      subscription.dispose();
    };
  },
};

export default RxJSAdapter;
