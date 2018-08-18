import xs, {Stream} from 'xstream';
import concat from 'xstream/extra/concat';
import {MainFn, Reducer} from './types';
import {StateSource} from './StateSource';
import microtask from 'quicktask';

const schedule = microtask();

export type Omit<T, K extends keyof T> = {[P in Exclude<keyof T, K>]: T[P]};

export type Forbid<T, K extends keyof T> = Omit<T, K> & {[P in K]?: never};

export type OSo<T, N extends string> = {[P in N]: StateSource<T>};
export type OSi<T, N extends string> = {[P in N]: Stream<Reducer<T>>};

export type MainWithState<
  So extends OSo<T, N>,
  Si extends OSi<T, N>,
  T,
  N extends string
> = MainFn<Forbid<So, N>, Omit<Si, N>>;

export function withState<
  So extends OSo<T, N>,
  Si extends OSi<T, N>,
  T = any,
  N extends string = 'state'
>(main: MainFn<So, Si>, name: N = 'state' as N): MainWithState<So, Si, T, N> {
  return function mainWithState(sources: Forbid<So, N>): Omit<Si, N> {
    const reducerMimic$ = xs.create<Reducer<T>>();
    const state$ = reducerMimic$
      .fold((state, reducer) => reducer(state), void 0 as T | undefined)
      .drop(1);
    const innerSources: So = sources as any;
    innerSources[name] = new StateSource<any>(state$, name);
    const sinks = main(innerSources);
    if (sinks[name]) {
      const stream$ = concat(
        xs.fromObservable<Reducer<T>>(sinks[name]),
        xs.never()
      );
      stream$.subscribe({
        next: i => schedule(() => reducerMimic$._n(i)),
        error: err => schedule(() => reducerMimic$._e(err)),
        complete: () => schedule(() => reducerMimic$._c()),
      });
    }
    return sinks as any;
  };
}
