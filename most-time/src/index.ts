import {Stream} from 'most';
import {timeDriverUntyped, mockTimeSourceUntyped, Frame, Comparator, OperatorArgs} from '@cycle/time';


export type Operator = <T>(stream: Stream<T>) => Stream<T>;

export interface TimeSource {
  createOperator<T>(): OperatorArgs<T>;
  animationFrames(): Stream<Frame>;
  delay(delayTime: number): Operator;
  debounce(period: number): Operator;
  throttle(period: number): Operator;
  periodic(period: number): Stream<number>;
  throttleAnimation: Operator;
}

export interface MockTimeSource extends TimeSource {
  diagram(str: string, values?: Object): Stream<any>;
  record(stream: Stream<any>): Stream<Array<any>>;
  assertEqual(
    actual: Stream<any>,
    expected: Stream<any>,
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
