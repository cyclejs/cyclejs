import {Observable} from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import {setAdapt} from '@cycle/run/lib/adapt';

import {mockTimeSource as mockTimeSourceUntyped} from './src/mock-time-source';
import {timeDriver as timeDriverUntyped} from './src/time-driver';
import {Frame} from './src/animation-frames';

setAdapt(stream => Observable.from(stream));

type Operator = <T>(observable: Observable<T>) => Observable<T>;

interface TimeSource {
  animationFrames(): Observable<Frame>;
  delay(delayTime: number): Operator;
  debounce(period: number): Operator;
  throttle(period: number): Operator;
  periodic(period: number): Observable<number>;
  throttleAnimation: Operator;
}

interface MockTimeSource extends TimeSource {
  diagram(str: string, values?: Object): Observable<any>;
  record(observable: Observable<any>): Observable<Array<any>>;
  assertEqual(actual: Observable<any>, expected: Observable<any>): void;
  run(cb?: (err?: Error) => void): void;
}

function mockTimeSource(args?: Object): MockTimeSource {
  return mockTimeSourceUntyped(args);
}

function timeDriver(sink: any): TimeSource {
  return timeDriverUntyped(sink);
}

export {
  Operator,

  TimeSource,
  timeDriver,

  MockTimeSource,
  mockTimeSource
};
