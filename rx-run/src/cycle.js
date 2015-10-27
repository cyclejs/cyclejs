let Rx = require(`rx`)

function makeRequestProxies(drivers) {
  let requestProxies = {}
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      requestProxies[name] = new Rx.ReplaySubject(1)
    }
  }
  return requestProxies
}

function callDrivers(drivers, requestProxies) {
  let responses = {}
  for (let name in drivers) {
    if (drivers.hasOwnProperty(name)) {
      responses[name] = drivers[name](requestProxies[name], name)
    }
  }
  return responses
}

function attachDisposeToRequests(requests, replicationSubscription) {
  Object.defineProperty(requests, `dispose`, {
    enumerable: false,
    value: () => { replicationSubscription.dispose() },
  })
  return requests
}

function makeDisposeResponses(responses) {
  return function dispose() {
    for (let name in responses) {
      if (responses.hasOwnProperty(name) &&
        typeof responses[name].dispose === `function`)
      {
        responses[name].dispose()
      }
    }
  }
}

function attachDisposeToResponses(responses) {
  Object.defineProperty(responses, `dispose`, {
    enumerable: false,
    value: makeDisposeResponses(responses),
  })
  return responses
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
  return function scopedDialogue(responses) {
    const scopedResponses = {}
    for (let key in responses) {
      if (responses.hasOwnProperty(key)) {
        if (typeof responses[key].confineResponse === `function`) {
          scopedResponses[key] = responses[key].confineResponse(
            responses[key], scope
          )
        } else {
          scopedResponses[key] = responses[key]
        }
      }
    }
    const requests = dialogue(scopedResponses)
    const scopedRequests = {}
    for (let key in requests) {
      if (requests.hasOwnProperty(key)) {
        if (responses.hasOwnProperty(key) &&
          typeof responses[key].confineRequest === `function`)
        {
          scopedRequests[key] = responses[key].confineRequest(
            requests[key], scope
          )
        } else {
          scopedRequests[key] = requests[key]
        }
      }
    }
    return scopedRequests
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

  let requestProxies = makeRequestProxies(drivers)
  let responses = callDrivers(drivers, requestProxies)
  let requests = main(responses)
  let subscription = replicateMany(requests, requestProxies).subscribe()
  let requestsWithDispose = attachDisposeToRequests(requests, subscription)
  let responsesWithDispose = attachDisposeToResponses(responses)
  return [requestsWithDispose, responsesWithDispose]
}

let Cycle = {
  /**
   * Takes an `main` function and circularly connects it to the given collection
   * of driver functions.
   *
   * The `main` function expects a collection of "driver response" Observables
   * as input, and should return a collection of "driver request" Observables.
   * A "collection of Observables" is a JavaScript object where
   * keys match the driver names registered by the `drivers` object, and values
   * are Observables or a collection of Observables.
   *
   * @param {Function} main a function that takes `responses` as input
   * and outputs a collection of `requests` Observables.
   * @param {Object} drivers an object where keys are driver names and values
   * are driver functions.
   * @return {Array} an array where the first object is the collection of driver
   * requests, and the second object is the collection of driver responses, that
   * can be used for debugging or testing.
   * @function run
   */
  run,

  /**
   * I need documentation.
   */
  isolate,
}

module.exports = Cycle
