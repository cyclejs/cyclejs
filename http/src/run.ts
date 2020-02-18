// This is all the stuff that should probably be part of @cycle/run

import { Source } from "@cycle/callbags";

export type Subscription = void;

export interface Driver<So, Si> {
  consumeSink(sink: Source<Si>): Subscription;
  produceSource(): Source<So>;
}

export type IdGenerator = () => number;
