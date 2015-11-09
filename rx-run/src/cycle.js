let Rx = require(`rx`)

function makeSinkProxies(drivers) {
  let sinkProxies = {}
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      sinkProxies[name] = new Rx.ReplaySubject(1)
    }
  }
  return sinkProxies
}

function callDrivers(drivers, sinkProxies) {
  let sources = {}
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      sources[name] = drivers[name](sinkProxies[name], name)
    }
  }
  return sources
}

function attachDisposeToSinks(sinks, replicationSubscription) {
  Object.defineProperty(sinks, `dispose`, {
    enumerable: false,
    value: () => { replicationSubscription.dispose() },
  })
  return sinks
}

function makeDisposeSources(sources) {
  return function dispose() {
    for (let name in sources) {
      if (sources.hasOwnProperty(name) &&
        typeof sources[name].dispose === `function`)
      {
        sources[name].dispose()
      }
    }
  }
}

function attachDisposeToSources(sources) {
  Object.defineProperty(sources, `dispose`, {
    enumerable: false,
    value: makeDisposeSources(sources),
  })
  return sources
}

function logToConsoleError(err) {
  let target = err.stack || err
  if (console && console.error) {
    console.error(target)
  }
}

function replicateMany(observables, subjects) {
  return Rx.Observable.create(observer => {
    let subscription = new Rx.CompositeDisposable()
    setTimeout(() => {
      for (let name in observables) {
        if (observables.hasOwnProperty(name) &&
          subjects.hasOwnProperty(name) &&
          !subjects[name].isDisposed)
        {
          subscription.add(
            observables[name]
              .doOnError(logToConsoleError)
              .subscribe(subjects[name].asObserver())
          )
        }
      }
      observer.onNext(subscription)
    }, 1)

    return function dispose() {
      subscription.dispose()
      for (let x in subjects) {
        if (subjects.hasOwnProperty(x)) {
          subjects[x].dispose()
        }
      }
    }
  })
}

function isObjectEmpty(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false
    }
  }
  return true
}

let counter

function newScope() {
  return `cy${++counter}`
}

function isolate(dialogue, scope = newScope()) {
  if (typeof dialogue !== `function`) {
    throw new Error(`First argument given to Cycle.isolate() must be a ` +
      `'dialogue' function`)
  }
  if (typeof scope !== `string`) {
    throw new Error(`Second argument given to Cycle.isolate() must be a ` +
      `string for 'scope'`)
  }
  return function scopedDialogue(sources) {
    const scopedSources = {}
    for (let key in sources) {
      if (sources.hasOwnProperty(key) &&
        typeof sources[key].isolateSource === `function`)
      {
        scopedSources[key] = sources[key].isolateSource(sources[key], scope)
      } else if (sources.hasOwnProperty(key)) {
        scopedSources[key] = sources[key]
      }
    }
    const sinks = dialogue(scopedSources)
    const scopedSinks = {}
    for (let key in sinks) {
      if (sinks.hasOwnProperty(key) &&
        sources.hasOwnProperty(key) &&
        typeof sources[key].isolateSink === `function`)
      {
        scopedSinks[key] = sources[key].isolateSink(sinks[key], scope)
      } else if (sinks.hasOwnProperty(key)) {
        scopedSinks[key] = sinks[key]
      }
    }
    return scopedSinks
  }
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
  if (isObjectEmpty(drivers)) {
    throw new Error(`Second argument given to Cycle.run() must be an object ` +
      `with at least one driver function declared as a property.`)
  }

  let sinkProxies = makeSinkProxies(drivers)
  let sources = callDrivers(drivers, sinkProxies)
  let sinks = main(sources)
  let subscription = replicateMany(sinks, sinkProxies).subscribe()
  let sinksWithDispose = attachDisposeToSinks(sinks, subscription)
  let sourcesWithDispose = attachDisposeToSources(sources)
  return [sinksWithDispose, sourcesWithDispose]
}

let Cycle = {
  /**
   * Takes an `main` function and circularly connects it to the given collection
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
   * @return {Array} an array where the first object is the collection of driver
   * sinks, and the second object is the collection of driver sources, that
   * can be used for debugging or testing.
   * @function run
   */
  run,

  /**
   * Takes a `dialogue` function and an optional `scope`, and returns a scoped
   * `dialogue` function.
   *
   * When the scoped `dialogue` function is invoked, each source, provided
   * to the scoped `dialogue`, are attempted called to isolate the source within
   * the scope. Likewise, the returned sinks from the invocation are also
   * attempted called to isolate each within the scope.
   *
   * @param {Function} dialogue a function that takes `sources` as input
   * and outputs a collection of `sinks`.
   * @param {String} scope an optional string that are passed to `sources`
   * and `sinks` when the returned scoped `dialogue` is invoked.
   * @return {Function} the scoped dialogue function that, as the original
   * dialogue function, takes `sources` that will be attempted isolated
   * and returns `sinks` that will be attempted isolated.
   * @function isolate
   */
  isolate,
}

module.exports = Cycle
