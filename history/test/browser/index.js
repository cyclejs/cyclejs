/* eslint max-nested-callbacks: 0 */
/* global describe, it */
import assert from 'assert'
import {Observable} from 'rx'
import {run} from '@cycle/core'
import {makeDOMDriver, h} from '@cycle/dom'
import {createHashHistory, createHistory} from 'history'
import {makeHistoryDriver, createLocation, supportsHistory} from '../../src'

const locationDefaults = {
  pathname: `/`,
  action: `POP`,
  hash: ``,
  search: ``,
  state: null,
  key: null,
  query: null,
}

function createRenderTarget(id = null) {
  let element = document.createElement(`div`)
  element.className = `cycletest`
  if (id) {
    element.id = id
  }
  document.body.appendChild(element)
  return element
}

describe(`History`, () => {
  describe(`createLocation`, () => {
    it(`should return a full location with no parameter`, () => {
      assert.deepEqual(createLocation(), locationDefaults)
    })

    it(`should accept just a string as the pathname`, () => {
      assert.deepEqual(createLocation(`/`), locationDefaults)
    })

    it(`should accept an object of location parameters`, () => {
      const location = createLocation({
        pathname: `/some/path`, state: {the: `state`},
      })
      const refLocattion = {
        ...locationDefaults,
        pathname: `/some/path`,
        state: {the: `state`},
      }

      assert.deepEqual(location, refLocattion)
    })
  })

  describe(`supportsHistory`, () => {
    it(`should return true if run in a modern browser`, () => {
      assert.strictEqual(supportsHistory(), true)
    })
  })

  describe(`historyDriver`, () => {
    it(`should throw if not given a valid history object`, () => {
      assert.throws(() => {
        makeHistoryDriver(null)
      }, TypeError)
    })

    it(`should capture link clicks when capture === true`, done => {
      const pathname = window.location.pathname
      const app = () => ({DOM: Observable.just(
        h(`div`, [
          h(`a.link`, {href: pathname + `/hello`}, `Hello`),
        ])
      )})

      const {sources} = run(app, {
        DOM: makeDOMDriver(createRenderTarget()),
        history: makeHistoryDriver(createHistory(), {capture: true}),
      })

      sources.history
        .filter(({action}) => action === `PUSH`)
        .subscribe(location => {
          assert.strictEqual(typeof location, `object`)
          assert.strictEqual(location.pathname, pathname + `/hello`)
          sources.dispose()
          done()
        })

      sources.DOM.observable.skip(1).take(1).subscribe((root) => {
        const element = root.querySelector(`.link`)
        assert.strictEqual(element.tagName, `A`)
        element.click()
      })
    })

    it(`should return an observable with a 'createHref' method`, () => {
      const history = createHashHistory()
      const history$ = makeHistoryDriver(history)(Observable.just(`/`))

      assert.strictEqual(history$ instanceof Observable, true)
      assert.strictEqual(typeof history$.createHref, `function`)
    })

    it(`should return a location to application`, () => {
      const app = () => ({history: Observable.just(`/`)})
      const {sources} = run(app, {
        history: makeHistoryDriver(createHashHistory()),
      })

      sources.history.subscribe(location => {
        assert.strictEqual(typeof location, `object`)
        assert.strictEqual(location.pathname, `/`)
        assert.strictEqual(location.state, null)
        sources.dispose()
      })
    })

    it(`should allow replacing a location`, () => {
      const app = () => ({
        history: Observable.just({type: `replace`, pathname: `/`}),
      })
      const {sources} = run(app, {
        history: makeHistoryDriver(createHashHistory()),
      })

      sources.history.subscribe(location => {
        assert.strictEqual(typeof location, `object`)
        assert.strictEqual(location.pathname, `/`)
        assert.strictEqual(location.state, null)
        sources.dispose()
      })
    })

    it(`should stop listening history after disposed`, (done) => {
      const app = () => ({})
      const history = createHashHistory()
      const {sources} = run(app, {
        history: makeHistoryDriver(history)
      })

      setTimeout(function(){
        sources.dispose()
        assert.doesNotThrow(function(){
          history.push(`/something`)
          done()
        }, Error, `does not throw after disposed`)
      })
    })
  })
})
