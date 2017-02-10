import * as most from 'most';
import {Stream} from 'most';
import {setAdapt} from '@cycle/run/lib/adapt';

import {mockTimeSource as mockTimeSourceUntyped} from './dist/mock-time-source';
import {timeDriver as timeDriverUntyped} from './dist/time-driver';
import {Frame} from './dist/animation-frames';

setAdapt(stream => most.from(stream as any));

export type Operator = <T>(stream: Stream<T>) => Stream<T>;

export interface TimeSource {
  animationFrames (): Stream<Frame>;
  delay (delayTime: number): Operator;
  debounce (period: number): Operator;
  throttle (period: number): Operator;
  periodic (period: number): Stream<number>;
  throttleAnimation: Operator;
}

export interface MockTimeSource extends TimeSource {
  diagram (str: string, values?: Object): Stream<any>;
  record (stream: Stream<any>): Stream<Array<any>>;
  assertEqual (actual: Stream<any>, expected: Stream<any>): void;
  run (cb?: (err?: Error) => void): void;
}

export function mockTimeSource (args?: Object): MockTimeSource {
  return mockTimeSourceUntyped(args);
}

export function timeDriver (_, adapter): TimeSource {
  return timeDriverUntyped(_, adapter);
}
