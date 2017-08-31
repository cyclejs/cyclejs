// This file is a template that is used to generate entry points
// for the different libraries support by @cycle/time
import {$$STREAM_TYPE$$} from '$$PACKAGE_NAME$$';
import {timeDriverUntyped, mockTimeSourceUntyped, Frame, Comparator, OperatorArgs} from '$$TIME_PACKAGE$$';
$$EXPORT$$

export type Operator = <T>(stream: $$STREAM_TYPE$$<T>) => $$STREAM_TYPE$$<T>;

export interface TimeSource {
  createOperator<T>(): OperatorArgs<T>;
  animationFrames(): $$STREAM_TYPE$$<Frame>;
  delay(delayTime: number): Operator;
  debounce(period: number): Operator;
  throttle(period: number): Operator;
  periodic(period: number): $$STREAM_TYPE$$<number>;
  throttleAnimation: Operator;
}

export interface MockTimeSource extends TimeSource {
  diagram(str: string, values?: Object): $$STREAM_TYPE$$<any>;
  record(stream: $$STREAM_TYPE$$<any>): $$STREAM_TYPE$$<Array<any>>;
  assertEqual(
    actual: $$STREAM_TYPE$$<any>,
    expected: $$STREAM_TYPE$$<any>,
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
