import {timeDriver as timeDriverUntyped} from './time-driver';
import {mockTimeSource as mockTimeSourceUntyped} from './mock-time-source';
import {TimeSource, MockTimeSource, Operator} from './time-source';

function mockTimeSource(args?: Object): MockTimeSource {
  return mockTimeSourceUntyped(args);
}

function timeDriver(sink: any): TimeSource {
  return timeDriverUntyped(sink);
}

export {Operator, TimeSource, timeDriver, MockTimeSource, mockTimeSource};
