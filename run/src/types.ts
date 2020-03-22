import { Producer, Dispose } from '@cycle/callbags';

export type Plugin<Source, Sink> = [
  Driver<Source, Sink>,
  ApiFactory<Source, Sink>
];

export type ApiFactory<Source, Sink> = (
  source: Producer<Source>,
  gen: IdGenerator
) => [any, Producer<Sink>];

export interface Driver<Source, Sink> {
  consumeSink(sink: Producer<Sink>): Dispose;
  provideSource(): Producer<Source>;
}

export type IdGenerator = () => number;

export type Main = (sources: any) => any;

export type MasterWrapper = (main: Main) => Main;

export type Subscription = () => void;
