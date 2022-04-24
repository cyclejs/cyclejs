import { Producer, Dispose, Subject } from '@cycle/callbags';

export type Plugin<Source, Sink> =
  | [Driver<Source, Sink>, ApiFactory<Source, Sink>]
  | Driver<Source, Sink>;
export type Plugins = Record<string, Plugin<any, any>>;
export type Wrapper = (m: Main, errorReporter?: (err: any) => void) => Main;

export type ApiFactory<Source, Sink, Result = Api<Source, Sink>> = (
  source: Producer<Source>,
  sinkSubject: Subject<Sink>,
  gen: IdGenerator
) => Result;

export interface Api<Source, Sink> {
  readonly source: Producer<Source>;
  create?(
    source: Producer<Source>,
    sinkSubject: Subject<Sink>,
    gen: IdGenerator
  ): Api<Source, Sink>;
}

export interface IsolateableApi<Source, Sink> extends Api<Source, Sink> {
  isolateSource(scope: any): IsolateableApi<any, any>;
  isolateSink(sink: Producer<Sink>, scope: any): Producer<any>;
}

export interface Driver<Source, Sink> {
  provideSource?(): Producer<Source>;
  consumeSink?(sink: Producer<Sink>): Dispose;
  cleanup?(): void;
}
export type ReadonlyDriver<Source> = Driver<Source, never>;
export type WriteonlyDriver<Sink> = Driver<never, Sink>;

export type IdGenerator = () => number;
export type Main = (...args: any[]) => any;
export type Subscription = Dispose;

export type PluginSources<P extends Plugins> = {
  [k in keyof P]: P[k] extends [Driver<any, any>, ApiFactory<any, any>]
    ? ReturnType<P[k][1]>
    : P[k] extends Driver<infer Source, any>
    ? Producer<Source>
    : never;
};
export type PluginSinks<P extends Plugins> = {
  [k in keyof P]?: P[k] extends Plugin<any, infer Sink>
    ? Producer<Sink>
    : never;
};

export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
export type ExpandFn<T> = T extends (a: infer A, ...rest: infer Rest) => infer U
  ? (a: Expand<A>, ...rest: Rest) => Expand<U>
  : never;

export type MatchingMain<P extends Plugins> = ExpandFn<
  (sources: PluginSources<P>) => PluginSinks<P>
>;

export type Engine<So, Si> = {
  sources: So;
  sinks: Si;
};

export type SingleEngine<So, Si> = Engine<So, Si> & {
  run: () => Subscription;
};

export type ReusableEngine<M extends Main, So, Si> = Engine<So, Si> & {
  dispose: Subscription;
  connect: (main: M) => Subscription;
};

export type WithoutChannel<
  M extends Main,
  Source,
  Sink,
  Channel extends string
> = M extends (
  sources: infer Sources,
  errorHandler?: (err: any) => void
) => infer Sinks
  ? [
      Channel extends keyof Sources
        ? Sources[Channel] extends Source
          ? Expand<Omit<Sources, Channel>>
          : `Wrong type in in sources for channel ${Channel}`
        : Sources,
      Channel extends keyof Sinks
        ? Sinks[Channel] extends Sink
          ? Expand<Omit<Sinks, Channel>>
          : `Wrong type in sinks for channel ${Channel}`
        : Sinks
    ] extends [infer NewSources, infer NewSinks]
    ? (s: NewSources, h?: (err: any) => void) => NewSinks
    : never
  : never;
