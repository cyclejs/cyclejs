import {Stream} from 'xstream';
import {Frame} from './animation-frames';
import {Scheduler} from './scheduler';

export type Operator = <T>(stream: Stream<T>) => Stream<T>;
export type Comparator = (actual: any, expected: any) => void;
export type OperatorArgs<T> = {
  schedule: Scheduler<T>;
  currentTime(): number;
};

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
