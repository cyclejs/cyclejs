/**
 * History driver factory
 *
 * This is a function which, when called, returns a History Driver for Cycle.js
 * apps. The driver is also a function, and it takes a stream of new locations
 * (strings representing pathnames or location objects) as input, and outputs
 * another stream of locations that were applied.
 *
 * @param {History} history the History object created by the history library.
 * This object is usually created through `createBrowserHistory()` or
 * `createHashHistory()` or `createMemoryHistory()` from the `history` library.
 * Alternatively, you may use `createServerHistory` from this library.
 * @param {object} options an object with some options specific to this driver.
 * Options may be: `capture`, a boolean to indicate whether the driver should
 * intercept and handle any click event that leads to a link, like on an `<a>`
 * element; `onError`, a callback function that takes an error as argument and
 * handles it, use this to configure what to do with driver errors.
 * @return {Function} the History Driver function
 * @function makeHistoryDriver
 */
export {makeHistoryDriver} from './makeHistoryDriver';
/**
 * Creates a "ServerHistory" object similar to the History objects that the
 * `history` library can create. Use this when you want to support server-side
 * rendering.
 *
 * @param {string|object} location this may be either a string representing the
 * pathname, or a location object with fields like `pathname`, `search`,
 * `query`, `state`, `action`, `key`, `hash`, etc.
 * @return {object} a History object.
 * @function createServerHistory
 */
export {createServerHistory} from './serverHistory';
export {supportsHistory, createLocation} from './util';

export * from './interfaces';
