import { Stream } from 'xstream';
export interface AdaptStream {
    (s: Stream<any>): any;
}
export declare function setAdapt(f: AdaptStream): void;
export declare function adapt(stream: Stream<any>): any;
