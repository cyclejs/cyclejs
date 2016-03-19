import {createLocation} from './util'

/*eslint-disable*/
/**
 * @typedef {ServerHistory}
 * @name ServerHistory
 * @public
 * @prop {function} listen - a way to listen for location changes (used internally)
 * @prop {function} push - a way to push new locations to listeners.
 *       Can be used to push url changes on the server-side.
 * @prop {function} replace - a way to replace the current location -
 * effectively the same as push() in this instance. (used internally)
 * @prop {function} createHref - creates an HREF (used internally)
 * @prop {createLocation} createLocation
 */
/*eslint-enable*/
function ServerHistory() {
  this.listeners = []
}

ServerHistory.prototype.listen = function listen(listener) {
  this.listeners.push(listener)
  return () => {}
}

ServerHistory.prototype.push = function push(location) {
  const listeners = this.listeners
  if (!listeners || listeners.length === 0) {
    throw new Error(`There is no active listener`)
  }
  listeners.forEach(l => l(createLocation(location)))
}

ServerHistory.prototype.replace = function replace(location) {
  const listeners = this.listeners
  if (!listeners || listeners.length === 0) {
    throw new Error(`There is no active listener`)
  }
  listeners.forEach(l => l(createLocation(location)))
}

ServerHistory.prototype.createHref = function createHref(path) {
  return path
}

ServerHistory.prototype.createLocation = createLocation

/**
 * @method createServerHistory
 * @public
 * @return {ServerHistory}
 * @example
 * // server-side
 * import express from 'express'
 * import {run} from '@cycle/core'
 * import {
 *   makeHistoryDriver,
 *   createServerHistory,
 *   createLocation
 * } from '@cycle/history'
 * import {makeHTMLDriver} from '@cycle/dom'
 *
 * const app = express()
 *
 * app.use((res, req) => {
 *   ...
 *   const history = createServerHistory()
 *   const {sources} = run(main, {
 *     history: makeHistoryDriver(history),
 *     html: makeHTMLDriver(),
 *   })
 *
 *   history.push(createLocation(req.url))
 *
 *   sources.html.subscribe(html => res.end(html))
 *   ...
 * })
 *
 * app.listen(3000)
 */
function createServerHistory() {
  return new ServerHistory()
}

export {createServerHistory}
