import { Producer, Dispose, Subject } from '@cycle/callbags';

export type Plugins = Record<string, Plugin<any, any>>;

export type Plugin<Source, Sink> = [
  Driver<Source, Sink>,
  ApiFactory<Source, Sink> | null
];

export type ApiFactory<Source, Sink> = (
  source: Producer<Source>,
  sinkSubject: Subject<Sink>,
  gen: IdGenerator
) => Api<Source, Sink>;

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

export type Main = (sources: any, ...rest: any[]) => any;

export type MasterWrapper = (
  main: Main,
  errorReporter?: (err: any) => void
) => Main;

export type Sinks = Record<string, Producer<any>>;

export type Subscription = () => void;

export type Engine = {
  sources: Record<string, any>;
  sinks: Record<string, Producer<any>>;
};

export type SingleEngine = Engine & {
  run: () => Subscription;
};

export type ReusableEngine = Engine & {
  dispose: Subscription;
  connect: (masterMain: Main) => Subscription;
};
