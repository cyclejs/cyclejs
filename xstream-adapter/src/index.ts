import {
  StreamAdapter,
  Observer,
  StreamSubscribe,
  DisposeFunction,
  Subject,
} from '@cycle/base';
import xs, {Stream, MemoryStream, Listener, Producer} from 'xstream';

const XStreamAdapter: StreamAdapter = {
  adapt<T>(originStream: any, originStreamSubscribe: StreamSubscribe): Stream<T> {
    if (XStreamAdapter.isValidStream(originStream)) { return originStream; };
    let dispose: any = null;

    return xs.create<T>((<Producer<T>>{
      start(out: Listener<T>) {
        const observer: Observer<T> = out;
        dispose = originStreamSubscribe(originStream, observer);
      },
      stop() {
        if (typeof dispose === 'function') {
          (<DisposeFunction> dispose());
        }
      }
    }));
  },

  makeSubject<T>(): Subject<T> {
    const stream = xs.create();

    const observer = {
      next: (x: any) => { stream.shamefullySendNext(x); },
      error: (err: any) => { stream.shamefullySendError(err); },
      complete: () => { stream.shamefullySendComplete(); }
    };

    return {observer, stream};
  },

  remember<T>(stream: Stream<T>): MemoryStream<T> {
    return stream.remember();
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.addListener === 'function' &&
      typeof stream.shamefullySendNext === 'function');
  },

  streamSubscribe(stream: Stream<any>, observer: Observer<any>) {
    stream.addListener(observer);
    return () => stream.removeListener(observer);
  }
};

export default XStreamAdapter;
