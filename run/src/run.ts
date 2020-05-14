import { merge, makeReplaySubject, Producer } from '@cycle/callbags';
import { Plugin, Main, MasterWrapper, Subscription } from './types';

let currentId = 0;

function cuid(): number {
  if (currentId === ++currentId) {
    currentId = 0;
  }
  return currentId;
}

export function bufferSync<T>(source: Producer<T>): Producer<T> {
  let sinks: any[] = [];
  let last: any = undefined;
  let hasLast = false;

  let talkback: any;

  source(0, (t, d) => {
    if (t === 0) {
      talkback = d;
    } else {
      if (t === 1) {
        Promise.resolve().then(() => {
          hasLast = false;
          last = void 0;
        });

        last = d;
        hasLast = true;
      }
      let hasDeleted = false;

      for (const sink of sinks) {
        if (sink) sink(t, d);
        else hasDeleted = true;
      }

      if (hasDeleted) {
        sinks = sinks.filter(x => x !== undefined);
        if (sinks.length === 0) {
          talkback(2);
        }
      }
    }
  });

  return (_, sink) => {
    sinks.push(sink);
    sink(0, () => {
      sinks[sinks.indexOf(sink)] = undefined;
    });
    if (hasLast) {
      sink(1, last);
    }
  };
}

export function run(
  main: Main,
  plugins: Record<string, Plugin<any, any>>,
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
      const masterSource = plugins[k][0].provideSource();
      if (masterSource) {
        masterSources[k] = bufferSync(masterSource);
      }
      sinkProxies[k] = makeReplaySubject();
      subscriptions[k] = plugins[k][0].consumeSink(sinkProxies[k]);
    }

    const masterSinks = masterMain(masterSources);

    for (const k of Object.keys(plugins)) {
      if (masterSinks[k]) {
        masterSinks[k](0, (t: any, d: any) => {
          if (t !== 0) {
            sinkProxies[k](t, d);
          }
        });
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
      const sinkSubject = makeReplaySubject();
      pluginSources[k] = plugins[k][1]
        ? plugins[k][1]!(sources[k], sinkSubject, cuid)
        : sources[k];
      pluginsSinks[k] = sinkSubject;
    }

    let sinks = main({ ...sources, ...pluginSources }) ?? {};

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
