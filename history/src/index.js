/* global require */
const {Rx} = require(`@cycle/core`)
const {
  createHistory,
  createHashHistory,
  useQueries,
  useBasename,
} = require(`history`)
const {filterLinks, supportsHistory} = require(`./helpers`)

function makeHistory(hash, queries, options) {
  const useHash = hash || !supportsHistory()
  if (useHash && queries) {
    return useQueries(useBasename(createHashHistory))(options)
  }
  if (useHash && !queries) {
    return useBasename(createHashHistory)(options)
  }
  if (!useHash && queries) {
    return useQueries(useBasename(createHistory))(options)
  }
  if (!useHash && !queries) {
    return useBasename(createHistory)(options)
  }
}

function createPushState(history, basename) {
  return function pushState(url) {
    if (`string` === typeof url) {
      history.pushState({}, url.replace(basename, ``))
    } else if (`object` === typeof url) {
      let {state = {}, path, query = {}} = url
      history.pushState(state, path.replace(basename, ``), query)
    } else {
      throw new Error(`History Driver input must be a string or
        object but received ${typeof url}`)
    }
  }
}

function createHistorySubject(history) {
  let subject = new Rx.BehaviorSubject()

  // Append methods for convenience.
  // To be removed if unneeded.
  Object.keys(history).forEach(key => {
    if (key !== `listen`) {
      subject[key] = history[key]
    }
  })

  return subject
}

function makeHistoryDriver(config) {
  const {hash = false, queries = true, ...options} = config || {}
  const history = makeHistory(hash, queries, options)
  const historySubject = createHistorySubject(history)

  return function historyDriver(url$) {
    url$
      .distinctUntilChanged()
      .subscribe(createPushState(history, options.basename || ``))

    history.listen(location => historySubject.onNext(location))
    // Convenience
    historySubject.location = historySubject.value

    return historySubject
  }
}

function makeServerHistoryDriver(startingLocation) {
  const {
    pathname = `/`,
    query = {},
    search = ``,
    state = {},
    action = `POP`,
    key = ``
  } = startingLocation || {}

  return function historyDriver() {
    return new Rx.BehaviorSubject({
      pathname,
      query,
      search,
      state,
      action,
      key
    })
  }
}

export {
  makeHistoryDriver,
  makeServerHistoryDriver,
  filterLinks
}
