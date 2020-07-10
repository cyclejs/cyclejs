import {Stream} from 'xstream';

export type FantasyObserver<T> = {
  next(x: T): void;
  error(err: any): void;
  complete(c?: any): void;
};

export type FantasySubscription = {
  unsubscribe(): void;
};

export type FantasyObservable<T> = {
  subscribe(observer: FantasyObserver<T>): FantasySubscription;
};

export type DevToolEnabledSource = {
  _isCycleSource: string;
};

export type SinkProxies<Si> = {[P in keyof Si]: Stream<any>};

export type Driver<Si, So> = Si extends void
  ? (() => So)
  : ((stream: Si) => So);

export type DisposeFunction = () => void;

export type Drivers = {
  [name: string]: Driver<Stream<any>, any | void>;
};

export type Main = (...args: Array<any>) => any;

export type Sources<D extends Drivers> = {[k in keyof D]: ReturnType<D[k]>};

export type Sinks<M extends Main> = ReturnType<M>;

export type MatchingMain<D extends Drivers, M extends Main> =
  | Main & {
      (so: Sources<D>): Sinks<M>;
    }
  | Main & {
      (): Sinks<M>;
    };

/**
 * For whatever reason, this does not work with RxJS observables,
 * this for this reason, `MatchingDrivers` has to be redefined
 * in @cycle/rxjs-run-
 */
export type ToStream<S> = S extends FantasyObservable<infer T> ? Stream<T> : S;

export type WidenStream<S, U> = S extends Stream<infer T>
  ? (T extends U ? U : never)
  : any;

export type GetValidInputs<D extends Driver<any, any>> = D extends Driver<
  infer S,
  any
>
  ? (S extends Stream<infer T> ? T : never)
  : never;

export type MatchingDrivers<D extends Drivers, M extends Main> = Drivers &
  {
    [k in string & keyof Sinks<M>]:
      | (() => Sources<D>[k])
      | ((
          si: Stream<WidenStream<ToStream<Sinks<M>[k]>, GetValidInputs<D[k]>>>
        ) => Sources<D>[k])
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
