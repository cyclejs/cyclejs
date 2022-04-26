import { merge, Subject } from '@cycle/callbags';
import {
  Plugin,
  Plugins,
  Main,
  Subscription,
  ApiFactory,
  ReusableEngine,
  SingleEngine,
  Wrapper,
  MatchingMain,
  PluginSinks,
  PluginSources,
  Expand,
  ID,
  Handler,
} from './types';
import { multicastNow } from './multicastNow';
import { makeReplaySubject } from './replaySubject';

let currentId = BigInt(0);

function cuid(): ID {
  return currentId++;
}

function defaultErrorHandler(err: any): never {
  throw err;
}

// prettier-ignore
export function run<M extends MatchingMain<P>, P extends Plugins>(main: M, plugins: P, wrappers?: [], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends Main, M7 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6, (m: M6) => M7], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends Main, M7 extends Main, M8 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6, (m: M6) => M7, (m: M7) => M8], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends Main, M7 extends Main, M8 extends Main, M9 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6, (m: M6) => M7, (m: M7) => M8, (m: M8) => M9], errorHandler?: Handler): Subscription;
// prettier-ignore
export function run<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends Main, M7 extends Main, M8 extends Main, M9 extends Main, M10 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6, (m: M6) => M7, (m: M7) => M8, (m: M8) => M9, (m: M9) => M10], errorHandler?: Handler): Subscription;
export function run(
  main: Main,
  plugins: Plugins,
  wrappers: [...Wrapper[]] = [],
  errorHandler: Handler = defaultErrorHandler
): Subscription {
  checkArguments(plugins, main);
  const { run } = setup(main, plugins, wrappers as any, errorHandler);
  return run();
}

// prettier-ignore
export function setup<M extends MatchingMain<P>, P extends Plugins>(main: M, plugins: P, wrappers?: [], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends Main, M7 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6, (m: M6) => M7], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends Main, M7 extends Main, M8 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6, (m: M6) => M7, (m: M7) => M8], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends Main, M7 extends Main, M8 extends Main, M9 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6, (m: M6) => M7, (m: M7) => M8, (m: M8) => M9], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
// prettier-ignore
export function setup<M0 extends Main, M1 extends Main, M2 extends Main, M3 extends Main, M4 extends Main, M5 extends Main, M6 extends Main, M7 extends Main, M8 extends Main, M9 extends Main, M10 extends MatchingMain<P>, P extends Plugins>(main: M0, plugins: P, wrappers: [(m: M0) => M1, (m: M1) => M2, (m: M2) => M3, (m: M3) => M4, (m: M4) => M5, (m: M5) => M6, (m: M6) => M7, (m: M7) => M8, (m: M8) => M9, (m: M9) => M10], errorHandler?: Handler): Expand<SingleEngine<Expand<PluginSources<P>>, Expand<PluginSinks<P>>>>;
export function setup(
  main: Main,
  plugins: Plugins,
  wrappers: [...Wrapper[]] = [],
  errorHandler: Handler = defaultErrorHandler
): SingleEngine<any, any> {
  checkArguments(plugins, main, 'setup');
  const { connect, dispose, sources, sinks } = setupReusable(
    plugins,
    errorHandler
  );

  const wrappedMain = makeWrappedMain(main, plugins, wrappers, errorHandler);
  const run = () => {
    const disconnect = connect(wrappedMain);
    return () => {
      disconnect();
      dispose();
    };
  };

  return { run, sources, sinks };
}

export function setupReusable<M extends MatchingMain<P>, P extends Plugins>(
  plugins: P,
  errorHandler: Handler = defaultErrorHandler
): Expand<ReusableEngine<M, PluginSources<P>, PluginSinks<P>>> {
  checkArguments(plugins, undefined, 'setupReusable');

  let sinkProxies: Record<string, Subject<any>> = {};
  let subscriptions: Record<string, Subscription> = {};
  let driverSources: any = {};

  for (const k of Object.keys(plugins)) {
    const driver = Array.isArray(plugins[k])
      ? (plugins[k] as any)[0]
      : plugins[k];
    const driverSource = driver.provideSource?.();
    if (driverSource) {
      driverSources[k] = multicastNow(driverSource);
    }
    if (driver.consumeSink) {
      sinkProxies[k] = makeReplaySubject();
      subscriptions[k] = driver.consumeSink(sinkProxies[k]);
    }
  }

  function connect(wrappedMain: Main): Subscription {
    let driverSinks = wrappedMain(driverSources);
    let sinkTalkbacks: Record<string, any> = {};

    for (const k of Object.keys(plugins)) {
      if (driverSinks?.[k] && sinkProxies[k]) {
        driverSinks[k](0, (t: any, d: any) => {
          if (t !== 0) {
            if (t === 2 && d) {
              errorHandler(d);
            } else sinkProxies[k](t, d);
          } else {
            sinkTalkbacks[k] = d;
          }
        });
      }
    }

    return () => {
      for (const k of Object.keys(sinkTalkbacks)) {
        sinkTalkbacks[k](2);
      }
    };
  }

  function dispose() {
    for (const k of Object.keys(subscriptions)) {
      subscriptions[k]?.();
      const driver = Array.isArray(plugins[k])
        ? (plugins[k] as any)[0]
        : plugins[k];
      driver.cleanup?.();
      driverSources[k]?.(2);
    }
  }

  let sources: any = {};
  for (const k of Object.keys(driverSources)) {
    const api = Array.isArray(plugins[k]) ? (plugins[k] as any)[1] : undefined;
    sources[k] = api
      ? api(driverSources[k], sinkProxies[k], cuid)
      : driverSources[k];
  }

  return { connect, dispose, sources, sinks: sinkProxies as any };
}

function checkArguments(plugins: Plugins, main?: Main, name = 'Cycle'): void {
  if (main && typeof main !== 'function') {
    throw new Error(
      `First argument given to ${name} must be the 'main' function`
    );
  }
  const arg = main ? 'Second' : 'First';
  if (typeof plugins !== 'object') {
    throw new Error(
      `${arg} argument given to ${name} must be an object with plugins`
    );
  } else if (Object.keys(plugins).length === 0) {
    throw new Error(
      `${arg} argument given to ${name} must be an object with at least one plugin`
    );
  }
}

function mapObj<A extends string | number | symbol, T, U>(
  f: (t: T) => U | undefined | null,
  x: Record<A, T>
): Record<A, U> {
  let result: Record<A, U> = {} as any;
  for (const key in x) {
    if (x.hasOwnProperty(key)) {
      const y = f(x[key]);
      if (y !== null && y !== undefined) {
        result[key] = y;
      }
    }
  }
  return result;
}

export function makeWrappedMain(
  main: Main,
  plugins: Record<string, Plugin<any, any>>,
  wrappers: [...Wrapper[]] = [],
  errorReporter: Handler = defaultErrorHandler
) {
  if (typeof main !== 'function') {
    throw new Error(
      "First argument given to Cycle must be the 'main' function"
    );
  }
  checkArguments(plugins, main);

  let m = applyApis(
    main,
    mapObj(plugin => (Array.isArray(plugin) ? plugin[1] : null), plugins)
  );

  for (let i = wrappers.length - 1; i >= 0; i--) {
    m = wrappers[i](m, errorReporter);
  }

  return m;
}

export function applyApis(
  main: Main,
  apis: Record<string, ApiFactory<any, any>> | string[]
): Main {
  return function appliedMain(sources: any, ...rest: any[]): any {
    let pluginSources: any = {};
    let pluginsSinks: any = {};

    if (Array.isArray(apis)) {
      for (const name of apis) {
        if (!sources[name]?.create) {
          throw new Error(
            `The api '${name}' does not implement the \`create\` method, please provide the api factory` +
              'instead of a plain array of channel names'
          );
        }

        const sinkSubject = makeReplaySubject();
        const source = sources[name].source ?? sources[name];

        pluginSources[name] = sources[name].create(source, sinkSubject, cuid);
        pluginsSinks[name] = sinkSubject;
      }
    } else {
      for (const k of Object.keys(apis)) {
        if (!sources[k]) continue;
        const sinkSubject = makeReplaySubject();
        const source = sources[k].source ?? sources[k];

        pluginSources[k] = apis[k]
          ? apis[k](source, sinkSubject, cuid)
          : source;
        pluginsSinks[k] = sinkSubject;
      }
    }

    let sinks = main({ ...sources, ...pluginSources }, ...rest) ?? {};

    for (const k of Object.keys(pluginsSinks)) {
      if (sinks[k]) {
        sinks[k] = merge(sinks[k], pluginsSinks[k]);
      } else {
        sinks[k] = pluginsSinks[k];
      }
    }

    return sinks;
  };
}
