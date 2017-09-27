import {Observable} from 'rxjs';
import {
  timeDriverUntyped,
  mockTimeSourceUntyped,
  Frame,
  Comparator,
  OperatorArgs,
} from '@cycle/time';

export type Operator = <T>(stream: Observable<T>) => Observable<T>;

export interface TimeSource {
  createOperator<T>(): OperatorArgs<T>;
  animationFrames(): Observable<Frame>;
  delay(delayTime: number): Operator;
  debounce(period: number): Operator;
  throttle(period: number): Operator;
  periodic(period: number): Observable<number>;
  throttleAnimation: Operator;
}

export interface MockTimeSource extends TimeSource {
  diagram(str: string, values?: Object): Observable<any>;
  record(stream: Observable<any>): Observable<Array<any>>;
  assertEqual(
    actual: Observable<any>,
    expected: Observable<any>,
    comparator?: Comparator,
  ): void;
  run(cb?: (err?: Error) => void): void;
}

export function mockTimeSource(args?: Object): MockTimeSource {
  return mockTimeSourceUntyped(args);
}

export function timeDriver(sink: any): TimeSource {
  return timeDriverUntyped(sink);
}
