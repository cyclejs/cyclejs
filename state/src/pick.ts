import { Sinks } from '@cycle/run';
import { Operator, merge, combine, pipe, map, flatten } from '@cycle/callbags';

export function pickMerge<U>(channel: string): Operator<Sinks[], U> {
  return instances$ =>
    pipe(
      instances$,
      map(sinks => merge(...sinks.map((s: any) => s[channel]))),
      flatten
    );
}

export function pickCombine<U>(channel: string): Operator<Sinks[], U[]> {
  return instances$ =>
    pipe(
      instances$,
      map(sinks => {
        debugger;
        return combine(...sinks.map((s: any) => s[channel]));
      }),
      flatten
    );
}
