import {Scheduler} from './scheduler';

export type Comparator = (actual: any, expected: any) => void | boolean;

export type OperatorArgs<T> = {
  schedule: Scheduler<T>;
  currentTime(): number;
};
