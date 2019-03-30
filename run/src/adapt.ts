import {Stream, xs} from 'xstream';

declare var window: any;

function getGlobal(this: any): any {
  let globalObj: any;
  if (typeof window !== 'undefined') {
    globalObj = window;
  } else if (typeof global !== 'undefined') {
    globalObj = global;
  } else {
    globalObj = this;
  }
  globalObj.Cyclejs = globalObj.Cyclejs || {};
  globalObj = globalObj.Cyclejs;
  globalObj.adaptStream = globalObj.adaptStream || ((x => x) as AdaptStream);
  globalObj.adaptStream = globalObj.adaptStream || (xs.fromObservable as AdaptStream);

  return globalObj;
}

export interface AdaptStream {
  (s: Stream<any>): any;
}

export function setAdapt(f: AdaptStream): void {
  getGlobal().adaptStream = f;
}

export function setUnadapt(f: any): void {
  getGlobal().unadaptStream = f
}

export function adapt(stream: Stream<any>): any {
  return getGlobal().adaptStream(stream);
}

export function unadapt(stream: Stream<any>): any {
  return getGlobal().unadaptStream(stream)
}