import xs, {Stream} from 'xstream';

export interface Sinks {
  [driverName: string]: Stream<any>;
}

export type DisposeFunction = () => void;

export interface DevToolEnabledSource {
  _isCycleSource: string;
}

export interface DriverFunction {
  (stream: Stream<any>, driverName: string): any;
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

function makeSinkProxies(drivers: DriversDefinition): Sinks {
  const sinkProxies: Sinks = {};
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      sinkProxies[name] = xs.create<any>();
    }
  }
  return sinkProxies;
}

function callDrivers(drivers: DriversDefinition, sinkProxies: Sinks): any {
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

function replicateMany(sinks: Sinks, sinkProxies: Sinks): DisposeFunction {
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
    .map(name => sinks[name].subscribe(replicators[name]));

  sinkNames.forEach((name) => {
    const listener = sinkProxies[name];
    const next = (x: any) => { listener._n(x); };
    const error = (err: any) => { logToConsoleError(err); listener._e(err); };
    const complete = () => listener._c();
    buffers[name]._n.forEach(next);
    buffers[name]._e.forEach(error);
    buffers[name]._c.forEach(complete);
    buffers = null as any; // free up for GC
    replicators[name].next = next;
    replicators[name].error = error;
    replicators[name].complete = complete;
    replicators[name]._n = next;
    replicators[name]._e = error;
    replicators[name]._c = complete;
  });

  return function disposeReplication() {
    subscriptions.forEach(s => s.unsubscribe());
  };
}

function disposeSources<So>(sources: So) {
  for (let k in sources) {
    if (sources.hasOwnProperty(k) && sources[k]
      && typeof sources[k].dispose === 'function') {
      sources[k].dispose();
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
 * const {sources, sinks, run} = Cycle(main, drivers);
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

  const sinkProxies: Sinks = makeSinkProxies(drivers as DriversDefinition);
  const sources: So = callDrivers(drivers as DriversDefinition, sinkProxies);
  const sinks: Si = main(sources);
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
