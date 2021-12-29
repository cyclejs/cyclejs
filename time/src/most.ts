import * as most from 'most';
import {Stream} from 'most';
import {setAdapt} from '@cycle/run/lib/adapt';

import {mockTimeSource as mockTimeSourceUntyped} from './mock-time-source';
import {timeDriver as timeDriverUntyped} from './time-driver';
import {Frame} from './animation-frames';
import {Comparator, OperatorArgs} from './types';

setAdapt(stream => most.from(stream as any));

type Operator = <T>(stream: Stream<T>) => Stream<T>;

interface TimeSource {
  animationFrames(): Stream<Frame>;
  delay(delayTime: number): Operator;
  debounce(period: number): Operator;
  throttle(period: number): Operator;
  periodic(period: number): Stream<number>;
  throttleAnimation: Operator;
  dispose(): void;
}

interface MockTimeSource extends TimeSource {
  createOperator<T>(): OperatorArgs<T>;
  diagram(str: string, values?: Object): Stream<any>;
  record(stream: Stream<any>): Stream<Array<any>>;
  assertEqual(
    actual: Stream<any>,
    expected: Stream<any>,
    comparator?: Comparator
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
