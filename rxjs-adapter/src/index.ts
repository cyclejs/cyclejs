import {
  StreamAdapter,
  Observer,
  StreamSubscribe,
  DisposeFunction,
  Subject,
} from '@cycle/base';
import {Observable as RxObservable} from 'rxjs/Observable';
import {Observer as RxObserver} from 'rxjs/Observer';
import {Subject as RxSubject} from 'rxjs/Subject';
import 'rxjs/add/operator/publishReplay';

const RxJSAdapter: StreamAdapter = {
  adapt <T>(originStream: any, originStreamSubscribe: StreamSubscribe): RxObservable<T> {
    if (this.isValidStream(originStream)) {
      return originStream;
    }
    return RxObservable.create((observer: Observer<T>) => {
      const dispose = originStreamSubscribe(originStream, observer);
      return () => {
        if (typeof dispose === 'function') {
          (dispose as DisposeFunction).call(null);
        }
      };
    });
  },

  remember <T>(observable: RxObservable<T>): RxObservable<T> {
    return observable.publishReplay(1).refCount();
  },

  makeSubject <T>(): Subject<T> {
    const stream: RxSubject<T> = new RxSubject<T>();
    const observer: RxObserver<T> = {
      next: (x: T) => { stream.next(x); },
      error: (err: any) => { stream.error(err); },
      complete: () => { stream.complete(); },
    };
    return {stream, observer};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.subscribe === 'function' &&
      typeof stream.addListener !== 'function' &&
      typeof stream.observe !== 'function' &&
      typeof stream.subscribeOnNext !== 'function' &&
      typeof stream.onValue !== 'function');
  },

  streamSubscribe <T>(stream: RxObservable<T>, observer: Observer<T>) {
    const subscription = stream.subscribe(observer);
    return () => {
      subscription.unsubscribe();
    };
  },
};

export default RxJSAdapter;
