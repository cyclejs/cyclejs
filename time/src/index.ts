import {timeDriver as timeDriverUntyped} from './time-driver';
import {mockTimeSource as mockTimeSourceUntyped} from './mock-time-source';
import {TimeSource, MockTimeSource} from './time-source';

export function mockTimeSource (args?: Object): MockTimeSource {
  return mockTimeSourceUntyped(args);
}

export function timeDriver (_, adapter): TimeSource {
  return timeDriverUntyped(_, adapter);
}
