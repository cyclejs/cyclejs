import {Stream, MemoryStream} from 'xstream';
import {Driver} from '@cycle/run';
import {Location} from 'history';
export type Pathname = string;

export type HistoryDriver = Driver<
  Stream<HistoryInput | GenericInput | string>,
  MemoryStream<Location>
>;

/**
 * A "catch all" case that is necessary because sometimes the sink from the app
 * is inferred by TypeScript to be {type: string, pathname: string} and this
 * wouldn't match any of the other HistoryInput types below, because the
 * property `type` was `string` and not e.g. `'push'`. Seems like a limitation
 * in TypeScript for the time being.
 */
export type GenericInput = {
  type: string;
  pathname?: Pathname;
  state?: any;
};

export type PushHistoryInput = {
  type: 'push';
  pathname: Pathname;
  state?: any;
};

export type ReplaceHistoryInput = {
  type: 'replace';
  pathname: Pathname;
  state?: any;
};

export type GoHistoryInput = {
  type: 'go';
  amount: number;
};

export type GoBackHistoryInput = {
  type: 'goBack';
};

export type GoForwardHistoryInput = {
  type: 'goForward';
};

export type HistoryInput =
  | PushHistoryInput
  | ReplaceHistoryInput
  | GoHistoryInput
  | GoBackHistoryInput
  | GoForwardHistoryInput;
