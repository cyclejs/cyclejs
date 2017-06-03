import {Stream} from 'xstream';

export interface AdaptStream {
  (s: Stream<any>): any;
}

let adaptStream: AdaptStream = x => x;

export function setAdapt(f: AdaptStream): void {
  adaptStream = f;
}

export function adapt(stream: Stream<any>): any {
  return adaptStream(stream);
}
