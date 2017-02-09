import {Observable} from 'rxjs/Observable';
import {Frame} from './src/animation-frames';

export type Operator = <T>(observable: Observable<T>) => Observable<T>;

export interface TimeSource {
  animationFrames (): Observable<Frame>;
  delay (delayTime: number): Operator;
  debounce (period: number): Operator;
  throttle (period: number): Operator;
  periodic (period: number): Observable<number>;
  throttleAnimation: Operator;
}

export interface MockTimeSource extends TimeSource {
  diagram (str: string, values?: Object): Observable<any>;
  record (observable: Observable<any>): Observable<Array<any>>;
  assertEqual (actual: Observable<any>, expected: Observable<any>): void;
  run (cb?: (err?: Error) => void): void;
}
