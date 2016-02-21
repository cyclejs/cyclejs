let Rx = require(`rx`)

function makeSinkProxies(drivers) {
  let sinkProxies = {}
  let keys = Object.keys(drivers)
  for (let i = 0; i < keys.length; i++) {
    sinkProxies[keys[i]] = new Rx.ReplaySubject(1)
  }
  return sinkProxies
}

function callDrivers(drivers, sinkProxies) {
  let sources = {}
  let keys = Object.keys(drivers)
  for (let i = 0; i < keys.length; i++) {
    let name = keys[i]
    sources[name] = drivers[name](sinkProxies[name], name)
  }
  return sources
}

function attachDisposeToSinks(sinks, replicationSubscription) {
  return Object.defineProperty(sinks, `dispose`, {
    value() { replicationSubscription.dispose() },
  })
}

function makeDisposeSources(sources) {
  return function dispose() {
    let keys = Object.keys(sources)
    for (let i = 0; i < keys.length; i++) {
      let source = sources[keys[i]]
      if (typeof source.dispose === `function`) {
        source.dispose()
      }
    }
  }
}

function attachDisposeToSources(sources) {
  return Object.defineProperty(sources, `dispose`, {
    value: makeDisposeSources(sources),
  })
}

let logToConsoleError = typeof console !== `undefined` && console.error
  ? error => { console.error(error.stack || error) }
  : Function.prototype

function replicateMany(observables, subjects) {
  return Rx.Observable.create(observer => {
    let subscription = new Rx.CompositeDisposable()
    setTimeout(() => {
      let keys = Object.keys(observables)
      for (let i = 0; i < keys.length; i++) {
        let name = keys[i]
        if (subjects.hasOwnProperty(name) && !subjects[name].isDisposed) {
          subscription.add(
            observables[name]
              .doOnError(logToConsoleError)
              .subscribe(subjects[name].asObserver())
          )
        }
      }
      observer.onNext(subscription)
    })

    return function dispose() {
      subscription.dispose()
      let keys = Object.keys(subjects)
      for (let i = 0; i < keys.length; i++) {
        subjects[keys[i]].dispose()
      }
    }
  })
}

function run(main, drivers) {
  if (typeof main !== `function`) {
    throw new Error(`First argument given to Cycle.run() must be the 'main' ` +
      `function.`)
  }
  if (typeof drivers !== `object` || drivers === null) {
    throw new Error(`Second argument given to Cycle.run() must be an object ` +
      `with driver functions as properties.`)
  }
  if (Object.keys(drivers).length === 0) {
    throw new Error(`Second argument given to Cycle.run() must be an object ` +
      `with at least one driver function declared as a property.`)
  }

  let sinkProxies = makeSinkProxies(drivers)
  let sources = callDrivers(drivers, sinkProxies)
  let sinks = main(sources)
  let subscription = replicateMany(sinks, sinkProxies).subscribe()
  let sinksWithDispose = attachDisposeToSinks(sinks, subscription)
  let sourcesWithDispose = attachDisposeToSources(sources)
  return {sources: sourcesWithDispose, sinks: sinksWithDispose}
}

let Cycle = {
  /**
   * Takes a `main` function and circularly connects it to the given collection
   * of driver functions.
   *
   * The `main` function expects a collection of "driver source" Observables
   * as input, and should return a collection of "driver sink" Observables.
   * A "collection of Observables" is a JavaScript object where
   * keys match the driver names registered by the `drivers` object, and values
   * are Observables or a collection of Observables.
   *
   * @param {Function} main a function that takes `sources` as input
   * and outputs a collection of `sinks` Observables.
   * @param {Object} drivers an object where keys are driver names and values
   * are driver functions.
   * @return {Object} an object with two properties: `sources` and `sinks`.
   * `sinks` is the collection of driver sinks, and `sources` is the collection
   * of driver sources, that can be used for debugging or testing.
   * @function run
   */
  run,
}

module.exports = Cycle
