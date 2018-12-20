import {Stream} from 'xstream';
import * as most from 'most';
import {Stream as MostStream} from 'most';
import {setAdapt} from '@cycle/run/lib/adapt';
import {
  setup as coreSetup,
  DisposeFunction,
  Drivers,
  Main,
  Sources,
  Sinks,
  GetValidInputs,
  WidenStream,
} from '@cycle/run';

export type ToMostStream<S> = S extends Stream<infer T> ? MostStream<T> : S;
export type ToMostStreams<S> = {[k in keyof S]: ToMostStream<S[k]>};

export type MatchingMain<D extends Drivers, M extends Main> =
  | Main & {
      (so: ToMostStreams<Sources<D>>): Sinks<M>;
    }
  | Main & {
      (): Sinks<M>;
    };

// We return S and not never, because isolation currently cannot type the return stream
// resulting in the value being typed any.
export type ToStream<S> = S extends MostStream<infer T> ? Stream<T> : S;

export type MatchingDrivers<D extends Drivers, M extends Main> = Drivers &
  {
    [k in string & keyof Sinks<M>]:
      | (() => Sources<D>[k])
      | ((
          si: Stream<WidenStream<ToStream<Sinks<M>[k]>, GetValidInputs<D[k]>>>
        ) => Sources<D>[k])
  };

export interface CycleProgram<
  D extends MatchingDrivers<D, M>,
  M extends MatchingMain<D, M>
> {
  sources: ToMostStreams<Sources<D>>;
  sinks: Sinks<M>;
  run(): DisposeFunction;
}

export interface Engine<D extends Drivers> {
  sources: Sources<D>;
  run<M extends MatchingMain<D, M>>(sinks: Sinks<M>): DisposeFunction;
  dispose(): void;
}

setAdapt(function adaptXstreamToMost(stream: Stream<any>): MostStream<any> {
  return most.from(stream as any);
});

/**
 * Takes a `main` function and circularly connects it to the given collection
 * of driver functions.
 *
 * **Example:**
 * ```js
 * import run from '@cycle/most-run';
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
  const program = coreSetup(main, drivers as any);
  return program.run();
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
 * import {setup} from '@cycle/most-run';
 * const {sources, sinks, run} = setup(main, drivers);
 * // ...
 * const dispose = run(); // Executes the application
 * // ...
 * dispose();
 * ```
 *
 * @param {Function} main a function that takes `sources` as input
 * and outputs `sinks`.
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
  return coreSetup(main, drivers as any) as any;
}

export default run;
