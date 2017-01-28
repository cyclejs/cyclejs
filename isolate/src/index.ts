let counter = 0;

function newScope(): string {
  return `cycle${++counter}`;
}

function checkIsolateArgs(dataflowComponent: Function, scope: any) {
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
  for (let key in sources) {
    const source = sources[key] as Partial<IsolateableSource>;
    if (sources.hasOwnProperty(key)
    && source
    && typeof source.isolateSource === 'function') {
      scopedSources[key] = source.isolateSource(source, scope) as So[keyof So];
    } else if (sources.hasOwnProperty(key)) {
      scopedSources[key] = sources[key];
    }
  }
  return scopedSources;
}

function isolateAllSinks<So extends Sources, Si>(sources: So, sinks: Si, scope: string): Si {
  const scopedSinks = {} as Si;
  for (let key in sinks) {
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

export type Component<So extends Sources, Si> = (sources: So, ...rest: Array<any>) => Si;

/**
 * Takes a `dataflowComponent` function and an optional `scope` string, and
 * returns a scoped version of the `dataflowComponent` function.
 *
 * When the scoped dataflow component is invoked, each source provided to the
 * scoped dataflowComponent is isolated to the scope using
 * `source.isolateSource(source, scope)`, if possible. Likewise, the sinks
 * returned from the scoped dataflow component are isolate to the scope using
 * `source.isolateSink(sink, scope)`.
 *
 * If the `scope` is not provided, a new scope will be automatically created.
 * This means that while **`isolate(dataflowComponent, scope)` is pure**
 * (referentially transparent), **`isolate(dataflowComponent)` is impure**
 * (not referentially transparent). Two calls to `isolate(Foo, bar)` will
 * generate two indistinct dataflow components. But, two calls to `isolate(Foo)`
 * will generate two distinct dataflow components.
 *
 * Note that both `isolateSource()` and `isolateSink()` are static members of
 * `source`. The reason for this is that drivers produce `source` while the
 * application produces `sink`, and it's the driver's responsibility to
 * implement `isolateSource()` and `isolateSink()`.
 *
 * @param {Function} dataflowComponent a function that takes `sources` as input
 * and outputs a collection of `sinks`.
 * @param {String} scope an optional string that is used to isolate each
 * `sources` and `sinks` when the returned scoped dataflow component is invoked.
 * @return {Function} the scoped dataflow component function that, as the
 * original `dataflowComponent` function, takes `sources` and returns `sinks`.
 * @function isolate
 */
function isolate<So extends Sources, Si>(component: Component<So, Si>,
                                         scope: any = newScope()): Component<So, Si> {
  checkIsolateArgs(component, scope);
  let convertedScope: string = typeof scope === 'string' ? scope : scope.toString();
  return function scopedComponent(sources: So, ...rest: Array<any>): Si {
    const scopedSources = isolateAllSources(sources, convertedScope);
    const sinks = component(scopedSources, ...rest);
    const scopedSinks = isolateAllSinks(sources, sinks, convertedScope);
    return scopedSinks;
  };
}

(isolate as any).reset = () => counter = 0;

export default isolate;
