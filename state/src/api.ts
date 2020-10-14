import type { IsolateableApi } from '@cycle/run';
import { Producer, Operator, pipe, map, filter } from '@cycle/callbags';

export type Reducer<T> = (currentState: T) => T;

export type Lens<T, S> = {
  get: (t: T) => S;
  set: (t: T, s: S) => T;
};

export class StateApi<T> implements IsolateableApi<T, Reducer<T>> {
  constructor(public readonly source: Producer<T>) {}

  public get stream(): Producer<T> {
    return this.source;
  }

  public isolateSource<S>(
    scope: string | number | symbol | Lens<T, S>
  ): StateApi<S> {
    const lens = makeDefaultLens(scope);

    const source = pipe(
      this.source,
      map(state => lens.get(state)),
      filter(x => typeof x !== 'undefined'),
      dropRepeats()
    );

    return new StateApi(source);
  }

  public isolateSink<S>(
    reducer$: Producer<Reducer<S>>,
    scope: string | number | symbol | Lens<T, S>
  ): Producer<Reducer<S>> {
    const lens = makeDefaultLens(scope);

    return pipe(
      reducer$,
      map(f => (state: T) => lens.set(state, f(lens.get(state))))
    );
  }
}

function makeDefaultLens<T, S>(
  scope: string | number | symbol | Lens<T, S>
): Lens<T, S> {
  if (typeof scope === 'object') {
    return scope;
  }
  return {
    get: (x: any) => x?.[scope],
    set: (x, y) => {
      if (Array.isArray(x)) {
        if (typeof y === 'undefined') {
          return x.filter((_, i) => i !== scope);
        } else return x.map((z, i) => (i === scope ? y : z)) as any;
      } else return { ...x, [scope]: y };
    },
  };
}

function dropRepeats<T>(): Operator<T, T> {
  let prev: any = {};

  return filter(x => {
    let result = x !== prev;
    prev = x;
    return result;
  });
}
