// This is all the stuff that should probably be part of @cycle/run

import { Producer, Dispose } from '@cycle/callbags';

export interface Driver<Source, Sink> {
  consumeSink(sink: Producer<Sink>): Dispose;
  provideSource(): Producer<Source>;
}

export type IdGenerator = () => number;
