import {Stream, MemoryStream} from 'xstream';
import {Location} from 'history';
export type Pathname = string;

export type HistoryDriver = (sink$: Stream<HistoryInput | string>) => MemoryStream<Location>;

export interface PushHistoryInput {
  type: 'push';
  pathname: Pathname;
  state?: any;
}

export interface ReplaceHistoryInput {
  type: 'replace';
  pathname: Pathname;
  state?: any;
}

export interface GoHistoryInput {
  type: 'go';
  amount: number;
}

export interface GoBackHistoryInput {
  type: 'goBack';
}

export interface GoForwardHistoryInput {
  type: 'goForward';
}

export type HistoryInput =
  PushHistoryInput
  | ReplaceHistoryInput
  | GoHistoryInput
  | GoBackHistoryInput
  | GoForwardHistoryInput;
