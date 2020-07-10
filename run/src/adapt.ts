import {Stream} from 'xstream';

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
  return globalObj;
}

export interface AdaptStream {
  (s: Stream<any>): any;
}

export function setAdapt(f: AdaptStream): void {
  getGlobal().adaptStream = f;
}

export function adapt(stream: Stream<any>): any {
  return getGlobal().adaptStream(stream);
}
