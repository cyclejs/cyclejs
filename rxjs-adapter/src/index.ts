import {
  StreamAdapter,
  Observer,
  StreamSubscribe,
  DisposeFunction,
  Subject,
} from '@cycle/base';
import * as Rx from 'rxjs';

const RxJSAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): Rx.Observable<T> {
    if (this.isValidStream(originStream)) {
      return originStream;
    }
    return Rx.Observable.create((observer: Observer<T>) => {
      const dispose = originStreamSubscribe(originStream, observer);
      return () => {
        if (typeof dispose === 'function') {
          (<DisposeFunction> dispose).call(null);
        }
      };
    });
  },

  remember<T>(observable: Rx.Observable<T>): Rx.Observable<T> {
    return observable.publishReplay(1);
  },

  makeSubject<T>(): Subject<T> {
    const stream: Rx.Subject<T> = new Rx.Subject<T>();
    const observer: Rx.Observer<T> = {
      next: (x: T) => { stream.next(x); },
      error: (err: any) => { stream.error(err); },
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

  streamSubscribe <T>(stream: Rx.Observable<T>, observer: Observer<T>) {
    const subscription = stream.subscribe(observer);
    return () => {
      subscription.unsubscribe();
    };
  },
};

export default RxJSAdapter;
