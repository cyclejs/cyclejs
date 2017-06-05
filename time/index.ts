import {timeDriver as timeDriverUntyped} from './src/time-driver';
import {mockTimeSource as mockTimeSourceUntyped} from './src/mock-time-source';
import {TimeSource, MockTimeSource, Operator} from './src/time-source';

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
