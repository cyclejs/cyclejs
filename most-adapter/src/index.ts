import {create} from 'most';
import {holdSubject} from 'most-subject';

// For TS Definitions
import {Observer, StreamAdapter, StreamSubscriber} from '@cycle/base';

const MostAdapter: StreamAdapter = {
  makeHoldSubject() {
    return holdSubject();
  },

  dispose(sinks: any, sinkProxies: any, sources: any) {
    Object.keys(sinkProxies).forEach(key => sinkProxies[key].observer.complete());
  },

  isValidStream(stream: any) {
    if (typeof stream.observe !== 'function') {
      return false;
    }
    return true;
  },

  subscribeToStream(stream: any, observer: Observer) {
    stream.observe((x: any) => observer.next(x))
      .then((x: any) => observer.complete(x))
      .catch((e: Error) => observer.error(e));
  },

  adapt(originStream: any, subscribeToOriginStream: StreamSubscriber) {
    if (MostAdapter.isValidStream(originStream)) {
      return originStream;
    }
    return create(
      (next: (x: any) => void, complete: (x: any) => void, error: (e: any) => void) => {
        const observer = {next, complete, error};
        subscribeToOriginStream(originStream, observer);
      }
    );
  }
};

export default MostAdapter
