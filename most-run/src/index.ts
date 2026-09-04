import xs, {Stream as XStream} from 'xstream';
import {newStream, run as runMost} from '@most/core';
import {newDefaultScheduler} from '@most/scheduler';
import {Disposable, Scheduler, Sink, Stream as MostStream} from '@most/types';
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

const mostScheduler = newDefaultScheduler();

export type ToMostStream<S> = S extends XStream<infer T> ? MostStream<T> : S;
export type ToMostStreams<S> = {[k in keyof S]: ToMostStream<S[k]>};

export type MatchingMain<D extends Drivers, M extends Main> =
  | (Main & {
      (so: ToMostStreams<Sources<D>>): Sinks<M>;
    })
  | (Main & {
      (): Sinks<M>;
    });

// We return S and not never, because isolation currently cannot type the return stream
// resulting in the value being typed any.
export type ToStream<S> = S extends MostStream<infer T> ? XStream<T> : S;

export type MatchingDrivers<D extends Drivers, M extends Main> = Drivers &
  {
    [k in string & keyof Sinks<M>]:
      | (() => Sources<D>[k])
      | ((
          si: XStream<WidenStream<ToStream<Sinks<M>[k]>, GetValidInputs<D[k]>>>
        ) => Sources<D>[k]);
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

/** Convert the xstream sources produced by Cycle drivers to @most/core. */
function adaptXstreamToMost<T>(stream: XStream<T>): MostStream<T> {
  return newStream(
    (sink: Sink<T>, scheduler: Scheduler): Disposable => {
      let active = true;
      const listener = {
        next(value: T) {
          if (!active) {
            return;
          }
          const time = scheduler.currentTime();
          try {
            sink.event(time, value);
          } catch (error) {
            active = false;
            stream.removeListener(listener);
            sink.error(time, error);
          }
        },
        error(error: any) {
          if (active) {
            active = false;
            sink.error(scheduler.currentTime(), error);
          }
        },
        complete() {
          if (active) {
            active = false;
            sink.end(scheduler.currentTime());
          }
        },
      };

      stream.addListener(listener);
      return {
        dispose() {
          active = false;
          stream.removeListener(listener);
        },
      };
    }
  );
}

/** Convert @most/core sinks to the observable shape consumed by @cycle/run. */
function adaptMostToXstream<T>(stream: MostStream<T>): XStream<T> {
  let disposable: Disposable | undefined;
  return xs.create<T>({
    start(listener) {
      try {
        disposable = runMost(
          {
            event(_time: number, value: T) {
              listener.next(value);
            },
            end() {
              listener.complete();
            },
            error(_time: number, error: Error) {
              listener.error(error);
            },
          },
          mostScheduler,
          stream
        );
      } catch (error) {
        listener.error(error);
      }
    },
    stop() {
      if (disposable) {
        disposable.dispose();
        disposable = undefined;
      }
    },
  });
}

function adaptMostSinks(sinks: any): any {
  const adapted: any = {};
  for (const name in sinks) {
    if (sinks.hasOwnProperty(name)) {
      const sink = sinks[name];
      adapted[name] =
        sink && typeof sink.run === 'function'
          ? adaptMostToXstream(sink)
          : sink;
    }
  }
  return adapted;
}

setAdapt(adaptXstreamToMost);

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
  return setup(main, drivers).run();
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
  if (typeof main !== 'function') {
    throw new Error(
      `First argument given to Cycle must be the 'main' function.`
    );
  }
  let sinks = {} as Sinks<M>;
  const program = coreSetup((sources: ToMostStreams<Sources<D>>) => {
    sinks = main(sources) as Sinks<M>;
    return adaptMostSinks(sinks);
  }, drivers as any);
  return {
    sources: program.sources,
    sinks,
    run: program.run,
  } as any;
}

export default run;
