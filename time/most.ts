import * as most from 'most';
import {Stream} from 'most';
import {setAdapt} from '@cycle/run/lib/adapt';

import {mockTimeSource as mockTimeSourceUntyped} from './src/mock-time-source';
import {timeDriver as timeDriverUntyped} from './src/time-driver';
import {Frame} from './src/animation-frames';
import {Scheduler} from './src/scheduler';

setAdapt(stream => most.from(stream as any));

type Operator = <T>(stream: Stream<T>) => Stream<T>;
export type Comparator = (actual: any, expected: any) => void;
export type OperatorArgs<T> = {
  schedule: Scheduler<T>;
  currentTime(): number;
};

interface TimeSource {
  animationFrames(): Stream<Frame>;
  delay(delayTime: number): Operator;
  debounce(period: number): Operator;
  throttle(period: number): Operator;
  periodic(period: number): Stream<number>;
  throttleAnimation: Operator;
}

interface MockTimeSource extends TimeSource {
  createOperator<T>(): OperatorArgs<T>;
  diagram(str: string, values?: Object): Stream<any>;
  record(stream: Stream<any>): Stream<Array<any>>;
  assertEqual(
    actual: Stream<any>,
    expected: Stream<any>,
    comparator?: Comparator,
  ): void;
  run(cb?: (err?: Error) => void): void;
}

function mockTimeSource(args?: Object): MockTimeSource {
  return mockTimeSourceUntyped(args);
}

function timeDriver(sink: any): TimeSource {
  return timeDriverUntyped(sink);
}

export {Operator, TimeSource, timeDriver, MockTimeSource, mockTimeSource};
