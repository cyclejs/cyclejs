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
) => any;

export interface Driver<Source, Sink> {
  provideSource?(): Producer<Source>;
  consumeSink?(sink: Producer<Sink>): Dispose;
  cleanup?(): void;
}
export type ReadonlyDriver<Source> = Driver<Source, never>;
export type WriteonlyDriver<Sink> = Driver<never, Sink>;

export type IdGenerator = () => number;

export type Main = (sources: any) => any;

export type MasterWrapper = (main: Main) => Main;

export type Subscription = () => void;

export type Engine = {
  connect: (masterMain: Main) => Subscription;
  dispose: Subscription;
};
