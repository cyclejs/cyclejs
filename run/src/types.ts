import {Stream} from 'xstream';

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

export type SinkProxies<Si extends Sinks> = {[P in keyof Si]: Stream<any>};

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
