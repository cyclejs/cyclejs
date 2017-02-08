let counter = 0;

function newScope(): string {
  return `cycle${++counter}`;
}

function checkIsolateArgs<So, Si>(dataflowComponent: Component<So, Si>, scope: any) {
  if (typeof dataflowComponent !== `function`) {
    throw new Error(`First argument given to isolate() must be a ` +
      `'dataflowComponent' function`);
  }
  if (scope === null) {
    throw new Error(`Second argument given to isolate() must not be null`);
  }
}

export interface IsolateableSource {
  isolateSource(source: Partial<IsolateableSource>, scope: string): Partial<IsolateableSource>;
  isolateSink<T>(sink: T, scope: string): T;
}

export interface Sources {
  [name: string]: Partial<IsolateableSource>;
}

function isolateAllSources<So extends Sources>(sources: So, scope: string): So {
  const scopedSources = {} as So;
  for (const key in sources) {
    const source = sources[key] as Partial<IsolateableSource>;
    if (sources.hasOwnProperty(key)
    && source
    && typeof source.isolateSource === 'function') {
      scopedSources[key] = source.isolateSource(source, scope);
    } else if (sources.hasOwnProperty(key)) {
      scopedSources[key] = sources[key];
    }
  }
  return scopedSources;
}

function isolateAllSinks<So extends Sources, Si>(sources: So, sinks: Si, scope: string): Si {
  const scopedSinks = {} as Si;
  for (const key in sinks) {
    const source = sources[key] as Partial<IsolateableSource>;
    if (sinks.hasOwnProperty(key)
    && source
    && typeof source.isolateSink === 'function') {
      scopedSinks[key] = source.isolateSink(sinks[key], scope);
    } else if (sinks.hasOwnProperty(key)) {
      scopedSinks[key] = sinks[key];
    }
  }
  return scopedSinks;
}

export type Component<So, Si> = (sources: So, ...rest: Array<any>) => Si;

/**
 * `isolate` takes a small component as input, and returns a big component.
 * A "small" component is a component that operates in a deeper scope.
 * A "big" component is a component that operates on a scope that
 * includes/wraps/nests the small component's scope. This is specially true for
 * isolation contexts such as onionify.
 *
 * Notice that we type BigSo/BigSi as any. This is unfortunate, since ideally
 * these would be generics in `isolate`. TypeScript's inference isn't strong
 * enough yet for us to automatically provide the typings that would make
 * `isolate` return a big component. However, we still keep these aliases here
 * in case TypeScript's inference becomes better, then we know how to proceed
 * to provide proper types.
 */
export type BigSo = any;
export type BigSi = any;

/**
 * Takes a `component` function and an optional `scope` string, and returns a
 * scoped version of the `component` function.
 *
 * When the scoped component is invoked, each source provided to the scoped
 * component is isolated to the given `scope` using
 * `source.isolateSource(source, scope)`, if possible. Likewise, the sinks
 * returned from the scoped component are isolated to the `scope` using
 * `source.isolateSink(sink, scope)`.
 *
 * If the `scope` is not provided, a new scope will be automatically created.
 * This means that while **`isolate(component, scope)` is pure**
 * (referentially transparent), **`isolate(component)` is impure**
 * (not referentially transparent). Two calls to `isolate(Foo, bar)` will
 * generate the same component. But, two calls to `isolate(Foo)` will generate
 * two distinct components.
 *
 * Note that both `isolateSource()` and `isolateSink()` are static members of
 * `source`. The reason for this is that drivers produce `source` while the
 * application produces `sink`, and it's the driver's responsibility to
 * implement `isolateSource()` and `isolateSink()`.
 *
 * @param {Function} component a function that takes `sources` as input
 * and outputs a collection of `sinks`.
 * @param {String} scope an optional string that is used to isolate each
 * `sources` and `sinks` when the returned scoped component is invoked.
 * @return {Function} the scoped component function that, as the original
 * `component` function, takes `sources` and returns `sinks`.
 * @function isolate
 */
function isolate<SmallSo, SmallSi>(component: Component<SmallSo, SmallSi>,
                                   scope: any = newScope()): Component<BigSo, BigSi> {
  checkIsolateArgs(component, scope);
  const convertedScope: string = typeof scope === 'string' ? scope : scope.toString();
  return function scopedComponent(sources: BigSo, ...rest: Array<any>): BigSi {
    const scopedSources = isolateAllSources(sources, convertedScope);
    const sinks = component(scopedSources, ...rest);
    const scopedSinks = isolateAllSinks(sources, sinks, convertedScope);
    return scopedSinks;
  };
}

(isolate as any).reset = () => counter = 0;

export default isolate;
