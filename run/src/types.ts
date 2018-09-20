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

export type SinkProxies<Si> = {[P in keyof Si]: Stream<any>};

export type Driver<Si, So> = {
  (stream?: Si, driverName?: string): So;
};

export type DisposeFunction = () => void;

export type Drivers = {
  [name: string]: Driver<FantasyObservable | undefined | void | null, any>;
};

export type Main = (...args: Array<any>) => any;

export type Sources<D extends Drivers> = {[k in keyof D]: ReturnType<D[k]>};

export type Sinks<M extends Main> = {
  [k in (string & keyof ReturnType<M>)]: ReturnType<M>[k] & FantasyObservable
};

export type MatchingMain<D extends Drivers, M extends Main> = Main & {
  (so?: Partial<Sources<D>>): Sinks<M>;
};

export type MatchingDrivers<D extends Drivers, M extends Main> = Drivers &
  {
    [k in (string & keyof Sinks<M>)]:
      | ((si?: Sinks<M>[k]) => Sources<D>[k])
      | ((si: Sinks<M>[k]) => Sources<D>[k])
  };

export interface CycleProgram<
  D extends MatchingDrivers<D, M>,
  M extends MatchingMain<D, M>
> {
  sources: Sources<D>;
  sinks: Sinks<M>;
  run(): DisposeFunction;
}

export interface Engine<D extends Drivers> {
  sources: Sources<D>;
  run<M extends MatchingMain<D, M>>(sinks: Sinks<M>): DisposeFunction;
  dispose(): void;
}
