import {
  StreamAdapter,
  Observer,
  StreamSubscribe,
  DisposeFunction,
  Subject,
} from '@cycle/base';

import {Stream} from 'most';
import {subject} from 'most-subject';
import hold from '@most/hold';

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

const MostAdapter: StreamAdapter = {
  adapt <T>(originStream: any, originStreamSubscribe: StreamSubscribe): Stream<T> {
    if (MostAdapter.isValidStream(originStream)) { return originStream; };
    let dispose: any;
    const stream = subject<any>();

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

  remember <T>(stream: Stream<T>): Stream<T> {
    return stream.thru(hold);
  },

  makeSubject <T>(): Subject<T> {
    const stream = subject<any>();

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

  streamSubscribe<T>(stream: Stream<any>, observer: Observer<T>) {
    const subscription = stream.subscribe(observer);
    return () => subscription.unsubscribe();
  }
};

export default MostAdapter;
