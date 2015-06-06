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

function makeDispose(requestProxies) {
  return function dispose() {
    for (let x in requestProxies) {
      if (requestProxies.hasOwnProperty(x)) {
        requestProxies[x].dispose();
      }
    }
  };
}

function makeAppInput(requestProxies, rawResponses) {
  return {
    get: makeGet(rawResponses),
    dispose: makeDispose(requestProxies)
  };
}

function replicateMany(original, imitators) {
  for (let name in original) { if (original.hasOwnProperty(name)) {
    if (imitators.hasOwnProperty(name) && !imitators[name].isDisposed) {
      original[name].subscribe(imitators[name].asObserver());
    }
  }}
}

function run(app, drivers) {
  // TODO Preconditions
  let requestProxies = makeRequestProxies(drivers);
  let rawResponses = callDrivers(drivers, requestProxies);
  let responses = makeAppInput(requestProxies, rawResponses);
  let requests = app(responses);
  setTimeout(() => replicateMany(requests, requestProxies), 1);
  return [requests, responses];
}

module.exports = run;
