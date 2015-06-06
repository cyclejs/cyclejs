'use strict';
let Rx = require('rx');

function makeRequestProxies(adapters) {
  let requestProxies = {};
  for (let name in adapters) { if (adapters.hasOwnProperty(name)) {
    requestProxies[name] = new Rx.ReplaySubject(1);
  }}
  return requestProxies;
}

function callAdapters(adapters, requestProxies) {
  let responses = {};
  for (let name in adapters) { if (adapters.hasOwnProperty(name)) {
    responses[name] = adapters[name](requestProxies[name], name);
  }}
  return responses;
}

function makeGet(rawResponses) {
  return function get(adapterName, ...params) {
    if (!rawResponses.hasOwnProperty(adapterName)) {
      throw new Error(`get(${adapterName}, ...) failed, no adapter function ` +
        `named ${adapterName} was found for this Cycle execution.`);
    }

    let adapterResponse = rawResponses[adapterName];
    if (typeof adapterResponse.subscribe === 'function') {
      return adapterResponse; // is an Observable
    } else if (typeof adapterResponse === 'object' &&
      typeof adapterResponse.get === 'function')
    {
      return rawResponses[adapterName].get.apply(null, params);
    } else if (typeof adapterResponse === 'object' &&
      params.length > 0 &&
      typeof params[0] === 'string' &&
      adapterResponse.hasOwnProperty(params[0]))
    {
      return rawResponses[adapterName][params[0]];
    } else {
      throw new Error(`get(${adapterName}, ...) failed because adapter was ` +
        `not able to process parameters. Report this bug to the adapter ` +
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

function run(app, adapters) {
  // TODO Preconditions
  let requestProxies = makeRequestProxies(adapters);
  let rawResponses = callAdapters(adapters, requestProxies);
  let responses = makeAppInput(requestProxies, rawResponses);
  let requests = app(responses);
  setTimeout(() => replicateMany(requests, requestProxies), 1);
  return [requests, responses];
}

module.exports = run;
