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

function makeGet(rawResponses) {
  return function get(driverName, ...params) {
    if (!rawResponses.hasOwnProperty(driverName)) {
      throw new Error(`get(${driverName}, ...) failed, no driver function ` +
        `named ${driverName} was found for this Cycle execution.`);
    }

    let driverResponse = rawResponses[driverName];
    if (typeof driverResponse.subscribe === 'function') {
      return driverResponse; // is an Observable
    } else if (typeof driverResponse === 'object' &&
      typeof driverResponse.get === 'function')
    {
      return rawResponses[driverName].get.apply(null, params);
    } else if (typeof driverResponse === 'object' &&
      params.length > 0 &&
      typeof params[0] === 'string' &&
      driverResponse.hasOwnProperty(params[0]))
    {
      return rawResponses[driverName][params[0]];
    } else {
      throw new Error(`get(${driverName}, ...) failed because driver was ` +
        `not able to process parameters. Report this bug to the driver ` +
        `function author.`);
    }
  };
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
  return {
    get: makeGet(rawResponses),
    dispose: makeDispose(requestProxies, rawResponses)
  };
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
