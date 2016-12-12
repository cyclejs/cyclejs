import { Stream } from 'xstream';
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
export interface XStreamSinks extends Sinks {
    [driverName: string]: Stream<any>;
}
export declare type DisposeFunction = () => void;
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
export declare function setup<So, Si>(main: (sources: So) => Si, drivers: DriversDefinition): CycleProgram<So, Si>;
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
export declare function run<So, Si>(main: (sources: So) => Si, drivers: DriversDefinition): DisposeFunction;
export default run;
