import {
  CycleExecution,
  CycleSetup,
  DisposeFunction
} from '@cycle/base';
import CycleBase from '@cycle/base';
import XStreamAdapter from '@cycle/xstream-adapter';

/**
 * Takes a `main` function and circularly connects it to the given collection
 * of driver functions.
 *
 * **Example:**
 * ```js
 * import {run} from '@cycle/xstream-run';
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
export function run<Sources, Sinks>(main: (sources: Sources) => Sinks,
                                    drivers: {[name: string]: Function}): DisposeFunction {
  const {run, sinks} = CycleBase(main, drivers, {streamAdapter: XStreamAdapter});
  if (typeof window !== 'undefined' && window['CyclejsDevTool_startGraphSerializer']) {
    window['CyclejsDevTool_startGraphSerializer'](sinks);
  }
  return run();
}

/**
 * A function that prepares the Cycle application to be executed. Takes a `main`
 * function and prepares to circularly connects it to the given collection of
 * driver functions. As an output, `Cycle()` returns an object with three
 * properties: `sources`, `sinks` and `run`. Only when `run()` is called will
 * the application actually execute. Refer to the documentation of `run()` for
 * more details.
 *
 * **Example:**
 * ```js
 * import Cycle from '@cycle/xstream-run';
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
 * @function Cycle
 */
const Cycle: CycleSetup = <CycleSetup>
  function <Sources, Sinks>(main: (sources: Sources) => Sinks,
                            drivers: {[name: string]: Function}): CycleExecution<Sources, Sinks> {
    const out = CycleBase(main, drivers, {streamAdapter: XStreamAdapter});
    if (typeof window !== 'undefined' && window['CyclejsDevTool_startGraphSerializer']) {
      window['CyclejsDevTool_startGraphSerializer'](out.sinks);
    }
    return out;
  };

Cycle.run = run;

export default Cycle;
