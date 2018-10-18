import {
  CycleProgram,
  DisposeFunction,
  Drivers,
  Sinks,
  MatchingDrivers,
  MatchingMain,
  Engine,
} from './types';
import {
  adaptSources,
  callDrivers,
  makeSinkProxies,
  disposeSources,
  disposeSinkProxies,
  isObjectEmpty,
  replicateMany,
} from './internals';

export {
  FantasyObserver,
  FantasySubscription,
  FantasyObservable,
  DevToolEnabledSource,
  Sources,
  Sinks,
  SinkProxies,
  Driver,
  Drivers,
  DisposeFunction,
  MatchingDrivers,
  MatchingMain,
  Main,
  CycleProgram,
  Engine,
  WidenStream,
  GetValidInputs,
} from './types';

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
export function setup<
  D extends MatchingDrivers<D, M>,
  M extends MatchingMain<D, M>
>(main: M, drivers: D): CycleProgram<D, M> {
  if (typeof main !== `function`) {
    throw new Error(
      `First argument given to Cycle must be the 'main' ` + `function.`
    );
  }
  if (typeof drivers !== `object` || drivers === null) {
    throw new Error(
      `Second argument given to Cycle must be an object ` +
        `with driver functions as properties.`
    );
  }
  if (isObjectEmpty(drivers)) {
    throw new Error(
      `Second argument given to Cycle must be an object ` +
        `with at least one driver function declared as a property.`
    );
  }

  const engine = setupReusable(drivers);
  const sinks = main(engine.sources);
  if (typeof window !== 'undefined') {
    (window as any).Cyclejs = (window as any).Cyclejs || {};
    (window as any).Cyclejs.sinks = sinks;
  }
  function _run(): DisposeFunction {
    const disposeRun = engine.run(sinks);
    return function dispose() {
      disposeRun();
      engine.dispose();
    };
  }
  return {sinks, sources: engine.sources, run: _run};
}

/**
 * A partially-applied variant of setup() which accepts only the drivers, and
 * allows many `main` functions to execute and reuse this same set of drivers.
 *
 * Takes an object with driver functions as input, and outputs an object which
 * contains the generated sources (from those drivers) and a `run` function
 * (which in turn expects sinks as argument). This `run` function can be called
 * multiple times with different arguments, and it will reuse the drivers that
 * were passed to `setupReusable`.
 *
 * **Example:**
 * ```js
 * import {setupReusable} from '@cycle/run';
 * const {sources, run, dispose} = setupReusable(drivers);
 * // ...
 * const sinks = main(sources);
 * const disposeRun = run(sinks);
 * // ...
 * disposeRun();
 * // ...
 * dispose(); // ends the reusability of drivers
 * ```
 *
 * @param {Object} drivers an object where keys are driver names and values
 * are driver functions.
 * @return {Object} an object with three properties: `sources`, `run` and
 * `dispose`. `sources` is the collection of driver sources, `run` is the
 * function that once called with 'sinks' as argument, will execute the
 * application, tying together sources with sinks. `dispose` terminates the
 * reusable resources used by the drivers. Note also that `run` returns a
 * dispose function which terminates resources that are specific (not reusable)
 * to that run.
 * @function setupReusable
 */
export function setupReusable<D extends Drivers>(drivers: D): Engine<D> {
  if (typeof drivers !== `object` || drivers === null) {
    throw new Error(
      `Argument given to setupReusable must be an object ` +
        `with driver functions as properties.`
    );
  }
  if (isObjectEmpty(drivers)) {
    throw new Error(
      `Argument given to setupReusable must be an object ` +
        `with at least one driver function declared as a property.`
    );
  }

  const sinkProxies = makeSinkProxies(drivers);
  const rawSources = callDrivers(drivers, sinkProxies);
  const sources = adaptSources(rawSources);
  function _run<M extends MatchingMain<D, M>>(
    sinks: Sinks<M>
  ): DisposeFunction {
    return replicateMany(sinks, sinkProxies as any);
  }
  function disposeEngine() {
    disposeSources(sources);
    disposeSinkProxies(sinkProxies);
  }
  return {sources, run: _run, dispose: disposeEngine};
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
export function run<
  D extends MatchingDrivers<D, M>,
  M extends MatchingMain<D, M>
>(main: M, drivers: D): DisposeFunction {
  const program = setup(main, drivers);
  if (
    typeof window !== 'undefined' &&
    (window as any).CyclejsDevTool_startGraphSerializer
  ) {
    (window as any).CyclejsDevTool_startGraphSerializer(program.sinks);
  }
  return program.run();
}

export default run;
