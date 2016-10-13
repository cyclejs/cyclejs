import {
  StreamAdapter,
  Observer,
  StreamSubscribe,
  Subject as CycleSubject,
} from '@cycle/base';
import {Stream} from 'most';
import {
  subject as getMostSubject,
} from 'most-subject';
import hold from '@most/hold';
import create = require('@most/create');

const MostAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): Stream<T> {
    if (MostAdapter.isValidStream(originStream)) { return originStream; };
    const stream = create((add, end, error) => {
       const disposer = originStreamSubscribe(originStream, {
         next: add,
         error: error,
         complete: end,
      });

      return disposer;
    });

    return stream as Stream<T>;
  },

  remember<T>(stream: Stream<T>): Stream<T> {
    return stream.thru(hold);
  },

  makeSubject<T>(): CycleSubject<T> {
    const stream = getMostSubject<any>();

    const observer = {
      next: (x: T) => { stream.next(x); },
      error: (err: Error) => { stream.error(err); },
      complete: (x?: T) => { stream.complete(x); },
    };

    return {observer, stream};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.drain === 'function' &&
      typeof stream.subscribe === 'function');
  },

  streamSubscribe<T>(stream: Stream<any>, observer: Observer<T>) {
    const subscription = stream.subscribe(observer);
    return () => subscription.unsubscribe();
  },
};

export default MostAdapter;
