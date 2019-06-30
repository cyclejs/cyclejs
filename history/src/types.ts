import {Stream, MemoryStream} from 'xstream';
import {Driver} from '@cycle/run';
import {Location} from 'history';
export type Pathname = string;
export type Search = string;
export type Hash = string;
export type LocationKey = string;

export type HistoryDriver = Driver<
  Stream<HistoryInput>,
  MemoryStream<Location>
>;

export type PushHistoryInput = {
  type: 'push';
  pathname?: Pathname;
  search?: Search;
  state?: any;
  hash?: Hash;
  key?: LocationKey;
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
  | GoForwardHistoryInput
  | string;
