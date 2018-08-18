export type MainFn<So, Si> = (sources: So) => Si;
export type Reducer<T> = (state: T | undefined) => T | undefined;
export type Getter<T, R> = (state: T | undefined) => R | undefined;
export type Setter<T, R> = (
  state: T | undefined,
  childState: R | undefined
) => T | undefined;
export type Lens<T, R> = {
  get: Getter<T, R>;
  set: Setter<T, R>;
};
export type ItemScopeFn = (key: string) => string | object;
export type ItemKeyFn<S> = (state: S, index?: number) => string;
export type Scope<T, R> = string | number | Lens<T, R>;
export type InternalInstances<Si> = {
  dict: Map<string, Si>;
  arr: Array<Si & {_key: string}>;
};
