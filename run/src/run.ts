import { merge, Subject } from '@cycle/callbags';
import {
  Plugin,
  Plugins,
  Main,
  MasterWrapper,
  Subscription,
  ApiFactory,
  ReusableEngine,
  SingleEngine,
} from './types';
import { multicastNow } from './multicastNow';
import { makeReplaySubject } from './replaySubject';

let currentId = 0;

function cuid(): number {
  if (currentId === ++currentId) {
    currentId = 0;
  }
  return currentId;
}

function defaultErrorHandler(err: any): void {
  throw err;
}

export function run(
  main: Main,
  plugins: Plugins,
  wrappers: MasterWrapper[] = [],
  errorHandler: (err: any) => void = defaultErrorHandler
): Subscription {
  checkArguments(plugins, main);
  const { run } = setup(main, plugins, wrappers, errorHandler);
  return run();
}

export function setup(
  main: Main,
  plugins: Plugins,
  wrappers: MasterWrapper[] = [],
  errorHandler: (err: any) => void = defaultErrorHandler
): SingleEngine {
  checkArguments(plugins, main, 'setup');
  const { connect, dispose, sources, sinks } = setupReusable(
    plugins,
    errorHandler
  );

  const masterMain = makeMasterMain(main, plugins, wrappers, errorHandler);
  const run = () => {
    const disconnect = connect(masterMain);
    return () => {
      disconnect();
      dispose();
    };
  };

  return { run, sources, sinks };
}

export function setupReusable(
  plugins: Plugins,
  errorHandler: (err: any) => void = defaultErrorHandler
): ReusableEngine {
  checkArguments(plugins, undefined, 'setupReusable');

  let sinkProxies: Record<string, Subject<any>> = {};
  let subscriptions: Record<string, Subscription> = {};
  let masterSources: any = {};

  for (const k of Object.keys(plugins)) {
    const driver = plugins[k][0];
    const masterSource = driver.provideSource?.();
    if (masterSource) {
      masterSources[k] = multicastNow(masterSource);
    }
    if (driver.consumeSink) {
      sinkProxies[k] = makeReplaySubject();
      subscriptions[k] = driver.consumeSink(sinkProxies[k]);
    }
  }

  function connect(masterMain: Main): Subscription {
    let masterSinks = masterMain(masterSources);
    let sinkTalkbacks: Record<string, any> = {};

    for (const k of Object.keys(plugins)) {
      if (masterSinks?.[k] && sinkProxies[k]) {
        masterSinks[k](0, (t: any, d: any) => {
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
      plugins[k][0].cleanup?.();
      masterSources[k]?.(2);
    }
  }

  let sources: any = {};
  for (const k of Object.keys(masterSources)) {
    sources[k] = plugins[k][1]
      ? plugins[k][1]!(masterSources[k], sinkProxies[k], cuid)
      : masterSources[k];
  }

  return { connect, dispose, sources, sinks: sinkProxies };
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

export function makeMasterMain(
  main: Main,
  plugins: Record<string, Plugin<any, any>>,
  wrappers: MasterWrapper[] = [],
  errorReporter: (err: any) => void = defaultErrorHandler
) {
  if (typeof main !== 'function') {
    throw new Error(
      "First argument given to Cycle must be the 'main' function"
    );
  }
  checkArguments(plugins, main);

  let m = applyApis(
    main,
    mapObj(([_, api]) => api, plugins)
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
