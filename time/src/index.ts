import {Stream} from 'xstream';

import {timeDriver as timeDriverUntyped} from './time-driver';
import {mockTimeSource as mockTimeSourceUntyped} from './mock-time-source';
import {Frame} from './animation-frames';
import {Scheduler} from './scheduler';
import {Comparator, OperatorArgs} from './types';

export {timeDriver as timeDriverUntyped} from './time-driver';
export {mockTimeSource as mockTimeSourceUntyped} from './mock-time-source';
export {Frame} from './animation-frames';
export {Scheduler} from './scheduler';
export * from './types';

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
