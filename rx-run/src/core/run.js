'use strict';
let Rx = require('rx');

function makeRequestProxies(drivers) {
  let requestProxies = {};
  for (let name in drivers) { if (drivers.hasOwnProperty(name)) {
    requestProxies[name] = new Rx.ReplaySubject(1);
  }}
  return requestProxies;
}

function callDrivers(drivers, requestProxies) {
  let responses = {};
  for (let name in drivers) { if (drivers.hasOwnProperty(name)) {
    responses[name] = drivers[name](requestProxies[name], name);
  }}
  return responses;
}

function makeDispose(requestProxies, rawResponses) {
  return function dispose() {
    for (let x in requestProxies) { if (requestProxies.hasOwnProperty(x)) {
      requestProxies[x].dispose();
    }}
    for (let name in rawResponses) {
      if (rawResponses.hasOwnProperty(name) &&
        typeof rawResponses[name].dispose === 'function')
      {
        rawResponses[name].dispose();
      }
    }
  };
}

function makeAppInput(requestProxies, rawResponses) {
  Object.defineProperty(rawResponses, 'dispose', {
    enumerable: false,
    value: makeDispose(requestProxies, rawResponses)
  });
  return rawResponses;
}

function replicateMany(original, imitators) {
  for (let name in original) { if (original.hasOwnProperty(name)) {
    if (imitators.hasOwnProperty(name) && !imitators[name].isDisposed) {
      original[name].subscribe(imitators[name].asObserver());
    }
  }}
}

function isObjectEmpty(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

function run(app, drivers) {
  if (typeof app !== 'function') {
    throw new Error('First argument given to Cycle.run() must be the `app` ' +
      'function.');
  }
  if (typeof drivers !== 'object' || drivers === null) {
    throw new Error('Second argument given to Cycle.run() must be an object ' +
      'with driver functions as properties.');
  }
  if (isObjectEmpty(drivers)) {
    throw new Error('Second argument given to Cycle.run() must be an object ' +
      'with at least one driver function declared as a property.');
  }

  let requestProxies = makeRequestProxies(drivers);
  let rawResponses = callDrivers(drivers, requestProxies);
  let responses = makeAppInput(requestProxies, rawResponses);
  let requests = app(responses);
  setTimeout(() => replicateMany(requests, requestProxies), 1);
  return [requests, responses];
}

module.exports = run;
