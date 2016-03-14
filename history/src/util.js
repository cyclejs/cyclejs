/**
 * Function that returns whether or not the current environment
 * supports the HistoryAPI
 * @public
 * @type {function}
 * @name supportsHistory()
 * @method supportsHistory()
 * @return {Boolean} Returns true if the current environment supports
 * the History API; false if it does not.
 * @example
 * import {run} from '@cycle/core'
 * import {makeHistoryDriver, supportsHistory} from 'cyclic-history'
 * import {createHashHistory, createHistory} from 'history'
 *
 * function main(sources) {...}
 *
 * const history = supportsHistory() ?
 *   createHistory() : createHashHistory()
 *
 * run(main, {
 *   history: makeHistoryDriver(history)
 * })
 */
function supportsHistory() {
  if (typeof navigator === `undefined`) {
    return false
  }

  const ua = navigator.userAgent

  if ((ua.indexOf(`Android 2.`) !== -1 ||
      ua.indexOf(`Android 4.0`) !== -1) &&
      ua.indexOf(`Mobile Safari`) !== -1 &&
      ua.indexOf(`Chrome`) === -1 &&
      ua.indexOf(`Windows Phone`) === -1)
  {
    return false
  }

  if (typeof window !== `undefined`) {
    return window.history && `pushState` in window.history
  } else {
    return false
  }
}

/**
 * Default parameters for createLocation; Same structure used by rackt/history
 * @public
 * @typedef {location}
 * @name location
 * @type {Object}
 * @property {string} pathname  defaults to '/'
 * @property {string} action  defaults to 'POP'
 * @property {string} hash  defaults to ''
 * @property {string} search defaults to  ''
 * @property {Object|Null} state defautls to null
 * @property {string|Null} key defaults to null
 */
const locationDefaults = {
  pathname: `/`,
  action: `POP`,
  hash: ``,
  search: ``,
  state: null,
  key: null,
  query: null,
}
/*eslint-disable*/
/**
 * Create a location object - particularly useful for server-side rendering
 * @method createLocation
 * @param  {location} [location=locationDefaults]  A location as
 * defined by [rackt/history](https://github.com/rackt/history/blob/master/docs/Glossary.md#location)
 * with sane defaults
 * @return {location}                a complete location object as defined by
 * [rackt/history](https://github.com/rackt/history/blob/master/docs/Glossary.md#location)
 */
/*eslint-enable*/
function createLocation(location = locationDefaults) {
  if (typeof location === `string`) {
    return {...locationDefaults, pathname: location}
  }
  return {...locationDefaults, ...location}
}

export {supportsHistory, createLocation}
