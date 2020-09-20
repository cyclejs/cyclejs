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
) => Api<Source>;

export interface Api<Source> {
  readonly source: Producer<Source>;
}
export interface IsolateableApi<Source, Sink> extends Api<Source> {
  isolateSource<So, Si>(scope: any): IsolateableApi<So, Si>;
  isolateSink<Si>(sink: Producer<Sink>, scope: any): Producer<Si>;
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

export type MasterWrapper = (main: Main) => Main;

export type Subscription = () => void;

export type Engine = {
  connect: (masterMain: Main) => Subscription;
  dispose: Subscription;
};
