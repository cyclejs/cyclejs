import {ReplaySubject} from 'rx'
import {captureClicks} from './captureClicks'

function makeUpdateHistory(history) {
  return function updateHistory(location) {
    if (`string` === typeof location) {
      history.push(history.createLocation(location))
    } else if (`object` === typeof location) {
      // suport things like history.replace()
      const {type = `push`, ...loc} = location
      if (type === `go`) {
        history[type](loc.value)
      } else {
        history[type](loc)
      }
    } else {
      throw new Error(`History Driver input must be a string or an ` +
        `object but received ${typeof url}`)
    }
  }
}

/**
 * Instantiates an new history driver function using a valid history object.
 * @public
 * @method makeHistoryDriver
 * @param  {object}          history - a valid history instance as defined by
 * ractk/history. Should have `createLocation()`, `createHref()`, `listen()`,
 * and `push()` methods.
 * @param {Object} options - options object - currently accepts a `boolean` for
 * the parameter `capture`. `capture` will automatically capture link clicks.
 * @return {historyDriver}                  The history driver function
 * @example
 * import {run} from '@cycle/core'
 * import {makeHistoryDriver} from '@cycle/history'
 * import {useQueries, createHashHistory} form 'history'
 *
 * function main(sources) {...}
 *
 * const history = createHashHistory()
 * run(main, {
 *   history: makeHistoryDriver(history),
 * })
 */
function makeHistoryDriver(history, options) {
  if (!history || typeof history !== `object` ||
    typeof history.createLocation !== `function` ||
    typeof history.createHref !== `function` ||
    typeof history.listen !== `function` ||
    typeof history.push !== `function`)
  {
    throw new TypeError(`makeHistoryDriver requires an valid history object ` +
      `containing createLocation(), createHref(), push(), and listen() methods`)
  }
  const capture = options && options.capture || false
  /*eslint-disable*/
  /**
   * The history driver used by run()
   * @typedef {historyDriver}
   * @name historyDriver
   * @public
   * @method historyDriver
   * @param  {Observable<location>}      sink$ The output returned from your main()
   * function. This can be a URL string, any valid Location object, or an object
   * with a type key to execute a particular history function like goBack(),
   * goForward(). When using type: 'go' a `value` key is expected to have an
   * integer with how many locations to go back or forward.
   * @example
   * return { history: Observable.just({type: 'go', value: -2}) }
   * return { history: Observable.just('/some/path')} }
   * return { history: Observable.just({pathname: '/some/path', state: {some: 'state'}}) }
   * @return {Observable<location>}            An Observable containing the current
   * location you have navigated to.
   */
  /*eslint-enable*/
  return function historyDriver(sink$) {
    let history$ = new ReplaySubject(1)
    history.listen(location => history$.onNext(location))

    sink$.subscribe(makeUpdateHistory(history))

    if (capture) {
      captureClicks(pathname => {
        const location = history.createLocation({pathname, action: `PUSH`})
        history.push(location)
      })
    }

    history$.createLocation = history.createLocation
    history$.createHref = history.createHref
    return history$
  }
}

export {makeHistoryDriver}
