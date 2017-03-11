import {timeDriver as timeDriverUntyped} from './time-driver';
import {mockTimeSource as mockTimeSourceUntyped} from './mock-time-source';
import {TimeSource, MockTimeSource, Operator} from './time-source';

function mockTimeSource (args?: Object): MockTimeSource {
  return mockTimeSourceUntyped(args);
}

function timeDriver (_, adapter): TimeSource {
  return timeDriverUntyped(_, adapter);
}


export {
  Operator,

  TimeSource,
  timeDriver,

  MockTimeSource,
  mockTimeSource
};
