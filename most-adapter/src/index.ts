import {create} from 'most';
import {holdSubject} from 'most-subject';

// For TS Definitions
import {Observer, HoldSubject, StreamAdapter, StreamSubscribe} from '@cycle/base';

const MostAdapter: StreamAdapter = {
  adapt(originStream: any, originStreamSubscribe: StreamSubscribe): any {
    if (MostAdapter.isValidStream(originStream)) {
      return originStream;
    }
    return create(
      (next: (x: any) => void, complete: (x: any) => void, error: (e: any) => void) => {
        const observer = {next, complete, error};
        originStreamSubscribe(originStream, observer);
      }
    );
  },

  dispose(sinks: any, sinkProxies: any, sources: any) {
    Object.keys(sinkProxies).forEach(key => sinkProxies[key].observer.complete());
  },

  makeHoldSubject(): HoldSubject {
    return holdSubject();
  },

  isValidStream(stream: any): boolean {
    return (
      typeof stream.observe === 'function' &&
      typeof stream.drain === 'function');
  },

  streamSubscribe(stream: any, observer: Observer) {
    stream.observe((x: any) => observer.next(x))
      .then((x: any) => observer.complete(x))
      .catch((e: Error) => observer.error(e));
  },
};

export default MostAdapter;
