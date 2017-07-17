import {Stream, MemoryStream} from 'xstream';

export interface FantasyObserver {
  next(x: any): void;
  error(err: any): void;
  complete(c?: any): void;
}

export interface FantasySubscription {
  unsubscribe(): void;
}

export interface FantasyObservable {
  subscribe(observer: FantasyObserver): FantasySubscription;
}

export interface DevToolEnabledSource {
  _isCycleSource: string;
}

export type Sources = {
  [name: string]: any;
};

export type Sinks = {
  [name: string]: any;
};

/**
 * Sink proxies should be MemoryStreams in order to fix race conditions for
 * drivers that subscribe to sink proxies "later".
 *
 * Recall that there are two steps:
 * 1. Setup (sink proxies -> drivers -> sources -> main -> sink)
 * 2. Execution (also known as replication: sink proxies imitate sinks)
 *
 * If a driver does not synchronously/immediately subscribe to the sink proxy
 * in step (1), but instead does that later, if step (2) feeds a value from the
 * sink to the sink proxy, then when the driver subscribes to the sink proxy,
 * it should receive that value. This is why we need MemoryStreams, not just
 * Streams. Note: Cycle DOM driver is an example of such case, since it waits
 * for 'readystatechange'.
 */
export type SinkProxies<Si extends Sinks> = {
  [P in keyof Si]: MemoryStream<any>
};

export type FantasySinks<Si> = {[S in keyof Si]: FantasyObservable};

export interface Driver<Sink, Source> {
  (stream: Sink, driverName?: string): Source;
}

export type Drivers<So extends Sources, Si extends Sinks> = {
  [P in keyof (So & Si)]: Driver<Si[P], So[P]>
};

export type DisposeFunction = () => void;

export interface CycleProgram<So extends Sources, Si extends Sinks> {
  sources: So;
  sinks: Si;
  run(): DisposeFunction;
}
