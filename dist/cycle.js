(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Cycle = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function makeSinkProxies(drivers, runStreamAdapter) {
  var sinkProxies = {};
  for (var _name in drivers) {
    if (drivers.hasOwnProperty(_name)) {
      var replaySubject = runStreamAdapter.replaySubject();
      var driverStreamAdapter = drivers[_name].streamAdapter || runStreamAdapter;

      var stream = driverStreamAdapter.adaptation(replaySubject.stream, runStreamAdapter.streamSubscription);

      sinkProxies[_name] = {
        stream: stream,
        sink: replaySubject.sink
      };
    }
  }
  return sinkProxies;
}
function callDrivers(drivers, sinkProxies) {
  var sources = {};
  for (var _name2 in drivers) {
    if (drivers.hasOwnProperty(_name2)) {
      sources[_name2] = drivers[_name2](sinkProxies[_name2].stream, _name2);
    }
  }
  return sources;
}

function replicateMany(sinks, sinkProxies, adapter) {
  setTimeout(function () {
    Object.keys(sinks).filter(function (name) {
      return sinkProxies[name];
    }).forEach(function (name) {
      adapter.replicate(sinks[name], sinkProxies[name].sink);
    });
  }, 1);
}

function isObjectEmpty(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

function run(main, drivers, _ref) {
  var streamAdapter = _ref.streamAdapter;

  if (typeof main !== "function") {
    throw new Error("First argument given to Cycle.run() must be the 'main' " + "function.");
  }
  if (typeof drivers !== "object" || drivers === null) {
    throw new Error("Second argument given to Cycle.run() must be an object " + "with driver functions as properties.");
  }
  if (isObjectEmpty(drivers)) {
    throw new Error("Second argument given to Cycle.run() must be an object " + "with at least one driver function declared as a property.");
  }

  if (!streamAdapter || isObjectEmpty(streamAdapter)) {
    throw new Error("Third argument given to Cycle.run() must be an object " + "with the streamAdapter key supplied with a valid stream adapter.");
  }

  var sinkProxies = makeSinkProxies(drivers, streamAdapter);
  var sources = callDrivers(drivers, sinkProxies);
  var sinks = main(sources);
  replicateMany(sinks, sinkProxies, streamAdapter);
  var dispose = function dispose() {
    streamAdapter.dispose(sinks, sinkProxies, sources);
  };
  return { sources: sources, sinks: sinks, dispose: dispose };
}

var Cycle = {
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
  run: run
};

exports["default"] = Cycle;
module.exports = exports["default"];

},{}]},{},[1])(1)
});