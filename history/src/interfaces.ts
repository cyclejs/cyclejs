export type Pathname = string;
export type QueryString = string;
export type Query = Object;
export type LocationState = Object;
export type Action = 'PUSH' | 'POP' | 'REPLACE';
export type LocationKey = string;

export interface Location {
  pathname?: Pathname;
  search?: QueryString;
  query?: Query;
  state?: LocationState;
  action?: Action;
  key?: LocationKey;
  hash?: string;
  type?: string; // historyDriver specific;
  value?: any; // historyDriver specific;
};

export type unlistenFn = () => void;

export type Listener = (location: Location) => void;

export interface History {
  listen(listener: Listener): unlistenFn;
  push(location: Location | Pathname): void;
  replace(location: Location| Pathname): void;
  createHref(href: Pathname): string;
  createLocation(location: Location | Pathname): Location;
};

export interface HistoryDriverOptions {
  capture?: boolean;
  onError?: (err: Error) => void;
}