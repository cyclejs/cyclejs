import {Observable, from} from 'rxjs';
// tslint:disable-next-line:no-import-side-effect
import {setAdapt} from '@cycle/run/lib/adapt';

import {mockTimeSource as mockTimeSourceUntyped} from './mock-time-source';
import {timeDriver as timeDriverUntyped} from './time-driver';
import {Frame} from './animation-frames';
import {Comparator, OperatorArgs} from './types';

setAdapt(from as any);

type Operator = <T>(observable: Observable<T>) => Observable<T>;

interface TimeSource {
  createOperator<T>(): OperatorArgs<T>;
  animationFrames(): Observable<Frame>;
  delay(delayTime: number): Operator;
  debounce(period: number): Operator;
  throttle(period: number): Operator;
  periodic(period: number): Observable<number>;
  throttleAnimation: Operator;
  dispose(): void;
}

interface MockTimeSource extends TimeSource {
  diagram(str: string, values?: Object): Observable<any>;
  record(observable: Observable<any>): Observable<Array<any>>;
  assertEqual(
    actual: Observable<any>,
    expected: Observable<any>,
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
