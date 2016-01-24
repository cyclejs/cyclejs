import {create} from 'most';
import {holdSubject} from 'most-subject';

export interface Observer {
  next: (x: any) => void;
  error: (e: any) => void;
  complete: (x: any) => void;
};

export type StreamSubscriber = (stream: any, observer: Observer) => void;

export interface StreamAdapter {
  makeHoldSubject: () => any;
  dispose: (sinks: any, sinkProxies: any, sources: any) => void;
  isValidStream: (stream: any) => boolean;
  subscribeToStream: StreamSubscriber;
  adapt: (originStream: any, subscribeToOriginStream: StreamSubscriber) => any;
};

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
