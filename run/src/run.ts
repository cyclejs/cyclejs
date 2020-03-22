import { merge, makeSubject } from '@cycle/callbags';
import { Plugin, Main, MasterWrapper, Subscription } from './types';

let currentId = 0;

function cuid(): number {
  if (currentId === ++currentId) {
    currentId = 0;
  }
  return currentId;
}

export function run(
  plugins: Record<string, Plugin<any, any>>,
  main: Main,
  wrappers: MasterWrapper[]
): Subscription {
  const masterMain = makeMasterMain(plugins, main, wrappers);
  const connect = setup(plugins);
  return connect(masterMain);
}

export function setup(
  plugins: Record<string, Plugin<any, any>>
): (masterMain: Main) => Subscription {
  return function connect(masterMain: Main) {
    let sinkProxies: any = {};
    let subscriptions: any = {};
    let masterSources: any = {};

    for (const k of Object.keys(plugins)) {
      sinkProxies[k] = makeSubject();
      subscriptions[k] = plugins[k][0].consumeSink(sinkProxies[k]);
      masterSources[k] = plugins[k][0].provideSource();
    }

    const masterSinks = masterMain(masterSources);

    for (const k of Object.keys(plugins)) {
      if (masterSinks[k]) {
        sinkProxies[k](0, masterSinks[k]);
      }
    }

    return () => {
      for (const k of Object.keys(subscriptions)) {
        subscriptions[k]();
      }
    };
  };
}

export function makeMasterMain(
  plugins: Record<string, Plugin<any, any>>,
  main: Main,
  wrappers: MasterWrapper[]
) {
  function masterMain(sources: any): any {
    let pluginSources: any = {};
    let pluginsSinks: any = {};

    for (const k of Object.keys(plugins)) {
      const [source, sink] = plugins[k][1](sources[k], cuid);
      pluginSources[k] = source;
      pluginsSinks[k] = sink;
    }

    let sinks = main({ ...sources, ...pluginSources });

    for (const k of Object.keys(pluginsSinks)) {
      if (sinks[k]) {
        sinks[k] = merge(sinks[k], pluginsSinks[k]);
      } else {
        sinks[k] = pluginsSinks[k];
      }
    }

    return sinks;
  }

  let m = masterMain;
  for (let i = wrappers.length - 1; i >= 0; i--) {
    m = wrappers[i](m);
  }

  return m;
}
