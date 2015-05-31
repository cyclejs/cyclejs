'use strict';
let Rx = require('rx');

function makeAdapterInputProxies(adapters) {
  let inputProxies = {};
  for (let name in adapters) { if (adapters.hasOwnProperty(name)) {
    inputProxies[name] = new Rx.AsyncSubject(); // a higher-order Observable
  }}
  return inputProxies;
}

function callAdapters(adapters, inputs) {
  let outputs = {};
  for (let name in adapters) { if (adapters.hasOwnProperty(name)) {
    outputs[name] = adapters[name](inputs[name].mergeAll(), name);
  }}
  return outputs;
}

function makeGet(adapterOutputs) {
  return function get(adapterName, ...params) {
    if (!adapterOutputs.hasOwnProperty(adapterName)) {
      throw new Error(`get(${adapterName}, ...) failed, no adapter function ` +
        `named ${adapterName} was found for this Cycle execution.`);
    }

    let adapterOutput = adapterOutputs[adapterName];
    if (typeof adapterOutput.subscribe === 'function') {
      return adapterOutput; // is an Observable
    } else if (typeof adapterOutput === 'object' &&
      typeof adapterOutput.get === 'function')
    {
      return adapterOutputs[adapterName].get.apply(null, params);
    } else if (typeof adapterOutput === 'object' &&
      params.length > 0 &&
      typeof params[0] === 'string' &&
      adapterOutput.hasOwnProperty(params[0]))
    {
      return adapterOutputs[adapterName][params[0]];
    } else {
      throw new Error(`get(${adapterName}, ...) failed because adapter was ` +
        `not able to process parameters. Report this bug to the adapter ` +
        `function author.`);
    }
  };
}

function replicateMany(original, imitators) {
  for (let name in original) { if (original.hasOwnProperty(name)) {
    if (imitators.hasOwnProperty(name)) {
      imitators[name].onNext(original[name].shareReplay(1));
      imitators[name].onCompleted();
    }
  }}
}

function run(app, adapters) {
  // TODO Preconditions
  let adapterInputProxies = makeAdapterInputProxies(adapters);
  let adapterOutputs = callAdapters(adapters, adapterInputProxies);
  let appInput = {get: makeGet(adapterOutputs)};
  let appOutput = app(appInput);
  replicateMany(appOutput, adapterInputProxies);
  return [appOutput, appInput]; // TODO test this
}

module.exports = run;
