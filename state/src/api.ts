import type { IsolateableApi } from '@cycle/run';
import { Producer, pipe, map } from '@cycle/callbags';

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
      map(state => lens.get(state))
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
    get: (x: any) => x[scope],
    set: (x, y) => ({ ...x, [scope]: y }),
  };
}
