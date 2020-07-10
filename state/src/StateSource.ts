import xs, {Stream, MemoryStream} from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';
import {DevToolEnabledSource} from '@cycle/run';
import {adapt} from '@cycle/run/lib/adapt';
import {Getter, Setter, Scope, Reducer} from './types';

function updateArrayEntry<T>(
  array: Array<T>,
  scope: number | string,
  newVal: any
): Array<T> {
  if (newVal === array[scope]) {
    return array;
  }
  const index = parseInt(scope as string);
  if (typeof newVal === 'undefined') {
    return array.filter((_val, i) => i !== index);
  }
  return array.map((val, i) => (i === index ? newVal : val));
}

function makeGetter<T, R>(scope: Scope<T, R>): Getter<T, R> {
  if (typeof scope === 'string' || typeof scope === 'number') {
    return function lensGet(state) {
      if (typeof state === 'undefined') {
        return void 0;
      } else {
        return state[scope];
      }
    };
  } else {
    return scope.get;
  }
}

function makeSetter<T, R>(scope: Scope<T, R>): Setter<T, R> {
  if (typeof scope === 'string' || typeof scope === 'number') {
    return function lensSet(
      state: T | undefined,
      childState: R | undefined
    ): T {
      if (Array.isArray(state)) {
        return updateArrayEntry(state, scope, childState) as any;
      } else if (typeof state === 'undefined') {
        return ({[scope]: childState} as any) as T;
      } else {
        return {...(state as any), [scope]: childState};
      }
    };
  } else {
    return scope.set;
  }
}

export function isolateSource<T, R>(
  source: StateSource<T>,
  scope: Scope<T, R>
): StateSource<R> {
  return source.select(scope);
}

export function isolateSink<T, R>(
  innerReducer$: Stream<Reducer<R>>,
  scope: Scope<T, R>
): Stream<Reducer<T>> {
  const get = makeGetter(scope);
  const set = makeSetter(scope);

  return innerReducer$.map(
    innerReducer =>
      function outerReducer(outer: T | undefined) {
        const prevInner = get(outer);
        const nextInner = innerReducer(prevInner);
        if (prevInner === nextInner) {
          return outer;
        } else {
          return set(outer, nextInner);
        }
      }
  );
}

/**
 * Represents a piece of application state dynamically changing over time.
 */
export class StateSource<S> {
  public stream: MemoryStream<S>;
  private _stream: MemoryStream<S>;
  private _name: string;

  constructor(stream: Stream<any>, name: string) {
    this._stream = stream
      .filter(s => typeof s !== 'undefined')
      .compose(dropRepeats())
      .remember();
    this._name = name;
    this.stream = adapt(this._stream);
    (this._stream as MemoryStream<S> &
      DevToolEnabledSource)._isCycleSource = name;
  }

  /**
   * Selects a part (or scope) of the state object and returns a new StateSource
   * dynamically representing that selected part of the state.
   *
   * @param {string|number|lens} scope as a string, this argument represents the
   * property you want to select from the state object. As a number, this
   * represents the array index you want to select from the state array. As a
   * lens object (an object with get() and set()), this argument represents any
   * custom way of selecting something from the state object.
   */
  public select<R>(scope: Scope<S, R>): StateSource<R> {
    const get = makeGetter(scope);
    return new StateSource<R>(this._stream.map(get), this._name);
  }

  public isolateSource = isolateSource;
  public isolateSink = isolateSink;
}
