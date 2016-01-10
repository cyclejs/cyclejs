import convert from 'stream-conversions'
import Rx from 'rx'

const defaultOptions = {
  streamLibrary: `rx`,
}

const isObjectEmpty = o => Object.keys(o).length <= 0

const makeSinkProxies = drivers =>
  Object.keys(drivers)
    .reduce((sinkProxies, driverName) => {
      const type = drivers[driverName].type || `rx`
      const sink = new Rx.ReplaySubject(1)
      const stream = convert.rx.to[type](sink)
      sinkProxies[driverName] = {sink, stream}
      return sinkProxies
    }, {})

const callDrivers = (drivers, sinkProxies, streamLibrary) =>
  Object.keys(drivers)
    .reduce((sources, driverName) => {
      const type = drivers[driverName].type || `rx`
      const conversionFn = convert[type].to[streamLibrary]
      sources[driverName] = drivers[driverName](
        sinkProxies[driverName].stream,
        conversionFn,
        driverName
      )
      return sources
    }, {})

function logToConsoleError(err) {
  let target = err.stack || err
  if (console && console.error) {
    console.error(target)
  }
}

const replicateMany = (sinks, sinkProxies, streamLibrary) =>
  Rx.Observable.create(observer => {
    let subscription = new Rx.CompositeDisposable()
    setTimeout(() => {
      Object.keys(sinks)
        .filter(driverName => sinkProxies[driverName]) // eslint-disable-line
        .forEach(driverName => { // eslint-disable-line
          const sinkProxy = sinkProxies[driverName]
          subscription.add(
            convert[streamLibrary].to.rx(sinks[driverName])
              .doOnError(logToConsoleError)
              .subscribe(sinkProxy.sink.asObserver())
          )
        })
      observer.onNext(subscription)
    }, 1)

    return function dispose() {
      subscription.dispose()
      for (let x in sinkProxies) {
        if (sinkProxies[x].sink.hasOwnProperty(x)) {
          sinkProxies[x].sink.dispose()
        }
      }
    }
  })

function run(main, drivers, options = defaultOptions) {
  const {streamLibrary} = options

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

  const sinkProxies = makeSinkProxies(drivers)
  const sources = callDrivers(drivers, sinkProxies, streamLibrary)
  const sinks = main(sources)
  const subscription =
    replicateMany(sinks, sinkProxies, streamLibrary).subscribe()

  const dispose = () => {
    Object.keys(sinkProxies)
      .forEach(key => sinkProxies[key].sink.dispose())
    subscription.dispose()
  }
  return {sinks, sources, dispose}
}

const Cycle = {run}

export default Cycle
