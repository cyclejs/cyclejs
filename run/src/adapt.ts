import {Stream} from 'xstream';

declare var window: any;

function getGlobal(): any {
  let globalObject: any;
  if (typeof window !== 'undefined') {
    globalObject = window;
  } else if (typeof global !== 'undefined') {
    globalObject = global;
  } else {
    globalObject = this;
  }

  globalObject.Cyclejs = globalObject.Cyclejs || {};
  globalObject.Cyclejs.adaptStream =
    globalObject.Cyclejs.adaptStream || ((x => x) as AdaptStream);

  return globalObject;
}

export interface AdaptStream {
  (s: Stream<any>): any;
}

export function setAdapt(f: AdaptStream): void {
  getGlobal().Cyclejs.adaptStream = f;
}

export function adapt(stream: Stream<any>): any {
  return getGlobal().Cyclejs.adaptStream(stream);
}
