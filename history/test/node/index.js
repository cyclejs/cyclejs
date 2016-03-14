/* eslint max-nested-callbacks: 0 */
/* global describe, it */
import assert from 'assert'
import {Observable} from 'rx'
import {run} from '@cycle/core'
import {makeHistoryDriver} from '../../src/makeHistoryDriver'
import {createServerHistory} from '../../src/serverHistory'
import {createLocation, supportsHistory} from '../../src/util'

const locationDefaults = {
  pathname: `/`,
  action: `POP`,
  hash: ``,
  search: ``,
  state: null,
  key: null,
  query: null,
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
      const refLocattion = Object.assign(locationDefaults, {
        pathname: `/some/path`, state: {the: `state`},
      })

      assert.deepEqual(location, refLocattion)
    })
  })

  describe(`supportsHistory`, () => {
    it(`should return false if run on the server`, () => {
      assert.strictEqual(supportsHistory(), false)
    })
  })

  describe(`createServerHistory`, () => {
    it(`should be an object`, () => {
      const history = createServerHistory()
      assert.strictEqual(typeof history, `object`)
      assert.strictEqual(typeof history.push, `function`)
      assert.strictEqual(typeof history.listen, `function`)
      assert.strictEqual(typeof history.replace, `function`)
    })

    it(`should return a function when .listen() is called`, () => {
      const history = createServerHistory()
      const unlisten = history.listen(() => {})
      assert.strictEqual(typeof unlisten, `function`)
      unlisten()
    })

    it(`should allow pushing locations`, (done) => {
      const history = createServerHistory()
      history.listen(location => {
        assert.strictEqual(typeof location, `object`)
        assert.strictEqual(location.pathname, `/some/path`)
        done()
      })
      history.push(`/some/path`)
    })

    it(`should create an href`, () => {
      const history = createServerHistory()
      assert.strictEqual(history.createHref(`/some/path`), `/some/path`)
    })

    it(`should create a location`, () => {
      const history = createServerHistory()
      const location = history.createLocation(`/some/path`)
      assert.strictEqual(typeof location, `object`)
      assert.strictEqual(location.pathname, `/some/path`)
      assert.strictEqual(location.state, null)
      assert.strictEqual(location.query, null)
    })
  })

  describe(`historyDriver`, () => {
    it(`should throw if not given a valid history object`, () => {
      assert.throws(() => {
        makeHistoryDriver()
      }, TypeError)
    })

    it(`should return a stream with createHref() and createLocation() methods`,
      () => {
        const history = createServerHistory()
        const history$ = makeHistoryDriver(history)(Observable.just(`/`))

        assert.strictEqual(history$ instanceof Observable, true)
        assert.strictEqual(typeof history$.createHref, `function`)
        assert.strictEqual(typeof history$.createLocation, `function`)
      })

    it(`should return a location to application`, () => {
      const app = () => ({history: Observable.just(`/`)})
      const {sources} = run(app, {
        history: makeHistoryDriver(createServerHistory()),
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
        history: Observable.just({
          type: `replace`,
          pathname: `/`,
        }),
      })
      const {sources} = run(app, {
        history: makeHistoryDriver(createServerHistory()),
      })

      sources.history.subscribe(location => {
        assert.strictEqual(typeof location, `object`)
        assert.strictEqual(location.pathname, `/`)
        assert.strictEqual(location.state, null)
        sources.dispose()
      })
    })
  })
})
