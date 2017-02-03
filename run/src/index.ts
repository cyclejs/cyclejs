import xs, {Stream, MemoryStream} from 'xstream';
import {adapt} from './adapt';

export interface FantasyObserver {
  next: (x: any) => void;
  error: (err: any) => void;
  complete: (c?: any) => void;
}

export interface FantasySubscription {
  unsubscribe: () => void;
}

export interface FantasyObservable {
  subscribe(observer: FantasyObserver): FantasySubscription;
}

export interface Sinks {
  [driverName: string]: FantasyObservable;
}

/**
 * Sink proxies should be MemoryStreams in order to fix race conditions for
 * drivers that subscribe to sink proxies "later".
 *
 * Recall that there are two steps:
 * 1. Setup (sink proxies -> drivers -> sources -> main -> sink)
 * 2. Execution (also known as replication: sink proxies imitate sinks)
 *
 * If a driver does not synchronously/immediately subscribe to the sink proxy
 * in step (1), but instead does that later, if step (2) feeds a value from the
 * sink to the sink proxy, then when the driver subscribes to the sink proxy,
 * it should receive that value. This is why we need MemoryStreams, not just
 * Streams. Note: Cycle DOM driver is an example of such case, since it waits
 * for 'readystatechange'.
 */
export interface SinkProxies extends Sinks {
  [driverName: string]: MemoryStream<any>;
}

export type DisposeFunction = () => void;

export interface DevToolEnabledSource {
  _isCycleSource: string;
}

export interface DriverFunction {
  (stream: FantasyObservable, driverName: string): any;
}

export interface DriversDefinition {
  [driverName: string]: DriverFunction;
}

export interface CycleProgram<So, Si> {
  sources: So;
  sinks: Si;
  run: () => DisposeFunction;
}

function logToConsoleError(err: any) {
  const target = err.stack || err;
  if (console && console.error) {
    console.error(target);
  } else if (console && console.log) {
    console.log(target);
  }
}

function makeSinkProxies(drivers: DriversDefinition): SinkProxies {
  const sinkProxies: SinkProxies = {};
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      sinkProxies[name] = xs.createWithMemory<any>();
    }
  }
  return sinkProxies;
}

function callDrivers(drivers: DriversDefinition, sinkProxies: SinkProxies): any {
  const sources = {};
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      sources[name] = drivers[name](sinkProxies[name], name);
      if (sources[name] && typeof sources[name] === 'object') {
        (sources[name] as DevToolEnabledSource)._isCycleSource = name;
      }
    }
  }
  return sources;
}

// NOTE: this will mutate `sources`.
function adaptSources<So extends Object>(sources: So): So {
  for (let name in sources) {
    if (sources.hasOwnProperty(name)
    && sources[name]
    && typeof sources[name]['shamefullySendNext'] === 'function') {
      sources[name] = adapt(sources[name] as any as Stream<any>);
    }
  }
  return sources;
}

interface SinkReplicators {
  [name: string]: {
    next: (x: any) => void;
    _n?: (x: any) => void;
    error: (err: any) => void;
    _e?: (err: any) => void;
    complete: () => void;
    _c?: () => void;
  };
}

interface ReplicationBuffers {
  [name: string]: {
    _n: Array<any>;
    _e: Array<any>;
    _c: Array<null>;
  };
}

function replicateMany(sinks: Sinks, sinkProxies: SinkProxies): DisposeFunction {
  const sinkNames = Object.keys(sinks).filter(name => !!sinkProxies[name]);

  let buffers: ReplicationBuffers = {};
  const replicators: SinkReplicators = {};
  sinkNames.forEach((name) => {
    buffers[name] = {_n: [], _e: [], _c: []};
    replicators[name] = {
      next: (x: any) => buffers[name]._n.push(x),
      error: (err: any) => buffers[name]._e.push(err),
      complete: () => buffers[name]._c.push(null),
    };
  });

  const subscriptions = sinkNames
    .map(name => xs.fromObservable<any>(sinks[name]).subscribe(replicators[name]));

  // A sink proxy should not complete before 500 milliseconds.
  // This is to allow late drivers (drivers that subscribe to the sink proxy
  // asynchronously later, not immediately when the driver is setup) to
  // have time to receive the 'next' values from the MemoryStream sink proxy.
  const EARLIEST_SINK_COMPLETE = 500; // milliseconds

  sinkNames.forEach((name) => {
    const listener = sinkProxies[name];
    const next = (x: any) => { listener._n(x); };
    const error = (err: any) => { logToConsoleError(err); listener._e(err); };
    const complete = () => { setTimeout(() => { listener._c(); }, EARLIEST_SINK_COMPLETE); };
    buffers[name]._n.forEach(next);
    buffers[name]._e.forEach(error);
    buffers[name]._c.forEach(complete);
    replicators[name].next = next;
    replicators[name].error = error;
    replicators[name].complete = complete;
    replicators[name]._n = next;
    replicators[name]._e = error;
    replicators[name]._c = complete;
  });
  buffers = null as any; // free up for GC

  return function disposeReplication() {
    subscriptions.forEach(s => s.unsubscribe());
  };
}

function disposeSources<So>(sources: So) {
  for (let k in sources) {
    if (sources.hasOwnProperty(k) && sources[k] && (sources[k] as any).dispose) {
      (sources[k] as any).dispose();
    }
  }
}

function isObjectEmpty(obj: any): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * A function that prepares the Cycle application to be executed. Takes a `main`
 * function and prepares to circularly connects it to the given collection of
 * driver functions. As an output, `setup()` returns an object with three
 * properties: `sources`, `sinks` and `run`. Only when `run()` is called will
 * the application actually execute. Refer to the documentation of `run()` for
 * more details.
 *
 * **Example:**
 * ```js
 * import {setup} from '@cycle/run';
 * const {sources, sinks, run} = setup(main, drivers);
 * // ...
 * const dispose = run(); // Executes the application
 * // ...
 * dispose();
 * ```
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Object} an object with three properties: `sources`, `sinks` and
 * `run`. `sources` is the collection of driver sources, `sinks` is the
 * collection of driver sinks, these can be used for debugging or testing. `run`
 * is the function that once called will execute the application.
 * @function setup
 */
export function setup<So, Si>(main: (sources: So) => Si,
                              drivers: DriversDefinition): CycleProgram<So, Si> {
  if (typeof main !== `function`) {
    throw new Error(`First argument given to Cycle must be the 'main' ` +
      `function.`);
  }
  if (typeof drivers !== `object` || drivers === null) {
    throw new Error(`Second argument given to Cycle must be an object ` +
      `with driver functions as properties.`);
  }
  if (isObjectEmpty(drivers)) {
    throw new Error(`Second argument given to Cycle must be an object ` +
      `with at least one driver function declared as a property.`);
  }

  const sinkProxies = makeSinkProxies(drivers);
  const sources: So = callDrivers(drivers, sinkProxies);
  const adaptedSources: So = adaptSources(sources);
  const sinks: Si = main(adaptedSources);
  if (typeof window !== 'undefined') {
    (window as any).Cyclejs = (window as any).Cyclejs || {};
    (window as any).Cyclejs.sinks = sinks;
  }
  function run(): DisposeFunction {
    const disposeReplication = replicateMany(sinks as any as Sinks, sinkProxies);
    return function dispose() {
      disposeSources(sources);
      disposeReplication();
    };
  };
  return {sinks, sources, run};
}

/**
 * Takes a `main` function and circularly connects it to the given collection
 * of driver functions.
 *
 * **Example:**
 * ```js
 * import run from '@cycle/run';
 * const dispose = run(main, drivers);
 * // ...
 * dispose();
 * ```
 *
 * The `main` function expects a collection of "source" streams (returned from
 * drivers) as input, and should return a collection of "sink" streams (to be
 * given to drivers). A "collection of streams" is a JavaScript object where
 * keys match the driver names registered by the `drivers` object, and values
 * are the streams. Refer to the documentation of each driver to see more
 * details on what types of sources it outputs and sinks it receives.
 *
 * @param {Function} main a function that takes `sources` as input and outputs
 * `sinks`.
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Function} a dispose function, used to terminate the execution of the
 * Cycle.js program, cleaning up resources used.
 * @function run
 */
export function run<So, Si>(main: (sources: So) => Si,
                            drivers: DriversDefinition): DisposeFunction {
  const {run, sinks} = setup(main, drivers);
  if (typeof window !== 'undefined' && window['CyclejsDevTool_startGraphSerializer']) {
    window['CyclejsDevTool_startGraphSerializer'](sinks);
  }
  return run();
}

export default run;
