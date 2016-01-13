function makeSinkProxies(drivers, runStreamAdapter) {
  const sinkProxies = {}
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      const replaySubject = runStreamAdapter.replaySubject()
      const driverStreamAdapter =
        drivers[name].streamAdapter || runStreamAdapter

      const stream = driverStreamAdapter.adaptation(
        replaySubject.stream,
        runStreamAdapter.streamSubscription
      )

      sinkProxies[name] = {
        stream,
        sink: replaySubject.sink,
      }
    }
  }
  return sinkProxies
}
function callDrivers(drivers, sinkProxies, runStreamAdapter) {
  const sources = {}
  for (const name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      const driverStreamAdapter =
        drivers[name].streamAdapter || runStreamAdapter

      const adapt = stream => // eslint-disable-line
        // don't create function in for-loop
        runStreamAdapter.adaptation(
          stream,
          driverStreamAdapter.streamSubscription
        )

      sources[name] = drivers[name](sinkProxies[name].stream, adapt, name)
    }
  }
  return sources
}

function replicateMany(sinks, sinkProxies, adapter) {
  setTimeout(() => {
    Object.keys(sinks)
      .filter(name => sinkProxies[name])
      .forEach(name => {
        adapter.replicate(
          sinks[name],
          sinkProxies[name].sink
        )
      })
  }, 1)
}

function isObjectEmpty(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false
    }
  }
  return true
}

function run(main, drivers, {streamAdapter}) {
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

  if (!streamAdapter || isObjectEmpty(streamAdapter)) {
    throw new Error(`Third argument given to Cycle.run() must be an object ` +
      `with the streamAdapter key supplied with a valid stream adapter.`)
  }

  const sinkProxies = makeSinkProxies(drivers, streamAdapter)
  const sources = callDrivers(drivers, sinkProxies, streamAdapter)
  const sinks = main(sources)
  replicateMany(sinks, sinkProxies, streamAdapter)
  const dispose = () => {
    streamAdapter.dispose(sinks, sinkProxies, sources)
  }
  return {sources, sinks, dispose}
}

const Cycle = {
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
   * @return {Object} an object with three properties:
   * `sources`, `sinks` and `dispose`.
   * `sinks` is the collection of driver sinks.
   * `sources` is the collection of driver sources,
   *  that can be used for debugging or testing.
   *  `dispose` is a function that stops the feedback loop
   * @function run
   */
  run,
}

export default Cycle
