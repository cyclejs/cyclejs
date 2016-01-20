export interface Observer {
  next: (x: any) => void;
  error: (e: any) => void;
  complete: (x: any) => void;
};

export type StreamSubscriber = (stream: any, observer: Observer) => void;

export interface StreamAdapter {
  makeHoldSubject: () => any;
  dispose: (sinks: any, sinkProxies: any, sources: any) => void;
  replicate: (stream: any, observer: Observer) => void;
  isValidStream: (stream: any) => boolean;
  subscribeToStream: StreamSubscriber;
  adapt: (originStream: any, subscribeToOriginStream: StreamSubscriber) => any;
};

import {Observable, ReplaySubject} from 'rxjs';

const Rx5Adapter: StreamAdapter = {

  makeHoldSubject() {
    const stream: ReplaySubject<any> = new ReplaySubject(1);
    const observer: Observer = {
      next: x => {stream.next(x); },
      error: err => {stream.error(err); },
      complete: x => {stream.complete(); },
    };
    return {stream, observer};
  },

  dispose(sinks: any, sinkProxies: any, sources: any) {
    Object.keys(sources).forEach(k => {
      if (typeof sources[k].dispose === 'function') {
        sources[k].dispose();
      }
    });
    Object.keys(sinkProxies).forEach(k => {
      sinkProxies[k].observer.complete();
    });
  },

  replicate(stream: any, observer: Observer) {
    stream.subscribe({
      next: (x: any) => {observer.next(x); },
      error: (e: any) => {observer.error(e); },
      complete: (x: any) => {observer.complete(x); },
    });
  },

  isValidStream(stream: any) {
    if (typeof stream.subscribe !== 'function' ||
      typeof stream.onValue === 'function') {
      return false;
    }
    return true;
  },

  subscribeToStream(stream: Observable<any>, observer: Observer) {
    stream.subscribe(<any> observer);
  },

  adapt(originStream: any, subscribeFromOriginStream: StreamSubscriber) {
    if (Rx5Adapter.isValidStream(originStream)) {
      return originStream;
    }
    return Observable.create((observer: Observer) => {
      subscribeFromOriginStream(originStream, observer);
    });
  }
};

export default Rx5Adapter
