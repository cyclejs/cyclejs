import {
  StreamAdapter,
  Observer,
  SinkProxies,
  StreamSubscribe,
  DisposeFunction,
  HoldSubject,
} from '@cycle/base';
import xs, {Stream, Producer} from 'xstream';

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

const XStreamAdapter: StreamAdapter = {
  adapt(originStream: any, originStreamSubscribe: StreamSubscribe): any {
    if (XStreamAdapter.isValidStream(originStream)) { return originStream; };
    let dispose: any = null;

    return xs.create((<Producer<any>>{
      start(out: any) {
        const observer: Observer = {
          next: (value: any) => out.shamefullySendNext(value),
          error: (err: any) => out.shamefullySendError(err),
          complete: () => out.shamefullySendComplete(),
        };
        dispose = originStreamSubscribe(originStream, observer);
      },
      stop() {
        if (typeof dispose === 'function') {
          (<DisposeFunction> dispose());
        }
      }
    }));
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
    const stream = xs.createWithMemory();

    const observer = {
      next: (x: any) => { stream.shamefullySendNext(x); },
      error: (err: any) => {
        logToConsoleError(err);
        stream.shamefullySendError(err);
      },
      complete: () => { stream.shamefullySendComplete(); }
    };

    return {observer, stream};
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.addListener === 'function' &&
      typeof stream.imitate === 'function');
  },

  streamSubscribe(stream: Stream<any>, observer: Observer) {
    stream.addListener(observer);
    return () => stream.removeListener(observer);
  }
};

export default XStreamAdapter;
