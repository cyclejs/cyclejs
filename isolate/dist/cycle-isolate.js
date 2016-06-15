(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.CycleIsolate = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
var counter = 0;
function newScope() {
    return "cycle" + ++counter;
}
function checkIsolateArgs(dataflowComponent, scope) {
    if (typeof dataflowComponent !== "function") {
        throw new Error("First argument given to isolate() must be a " +
            "'dataflowComponent' function");
    }
    if (scope === null) {
        throw new Error("Second argument given to isolate() must not be null");
    }
}
function isolateAllSources(sources, scope) {
    var scopedSources = {};
    for (var key in sources) {
        if (sources.hasOwnProperty(key) && sources[key]
            && typeof sources[key].isolateSource === "function") {
            scopedSources[key] = sources[key].isolateSource(sources[key], scope);
        }
        else if (sources.hasOwnProperty(key)) {
            scopedSources[key] = sources[key];
        }
    }
    return scopedSources;
}
function isolateAllSinks(sources, sinks, scope) {
    var scopedSinks = {};
    for (var key in sinks) {
        if (sinks.hasOwnProperty(key)
            && sources[key]
            && typeof sources[key].isolateSink === "function") {
            scopedSinks[key] = sources[key].isolateSink(sinks[key], scope);
        }
        else if (sinks.hasOwnProperty(key)) {
            scopedSinks[key] = sinks[key];
        }
    }
    return scopedSinks;
}
/**
 * Takes a `dataflowComponent` function and an optional `scope` string, and
 * returns a scoped version of the `dataflowComponent` function.
 *
 * When the scoped dataflow component is invoked, each source provided to the
 * scoped dataflowComponent is isolated to the scope using
 * `source.isolateSource(source, scope)`, if possible. Likewise, the sinks
 * returned from the scoped dataflow component are isolate to the scope using
 * `source.isolateSink(sink, scope)`.
 *
 * If the `scope` is not provided, a new scope will be automatically created.
 * This means that while **`isolate(dataflowComponent, scope)` is pure**
 * (referentially transparent), **`isolate(dataflowComponent)` is impure**
 * (not referentially transparent). Two calls to `isolate(Foo, bar)` will
 * generate two indistinct dataflow components. But, two calls to `isolate(Foo)`
 * will generate two distinct dataflow components.
 *
 * Note that both `isolateSource()` and `isolateSink()` are static members of
 * `source`. The reason for this is that drivers produce `source` while the
 * application produces `sink`, and it's the driver's responsibility to
 * implement `isolateSource()` and `isolateSink()`.
 *
 * @param {Function} dataflowComponent a function that takes `sources` as input
 * and outputs a collection of `sinks`.
 * @param {String} scope an optional string that is used to isolate each
 * `sources` and `sinks` when the returned scoped dataflow component is invoked.
 * @return {Function} the scoped dataflow component function that, as the
 * original `dataflowComponent` function, takes `sources` and returns `sinks`.
 * @function isolate
 */
function isolate(component, scope) {
    if (scope === void 0) { scope = newScope(); }
    checkIsolateArgs(component, scope);
    var convertedScope = typeof scope === 'string' ? scope : scope.toString();
    return function scopedComponent(sources) {
        var rest = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            rest[_i - 1] = arguments[_i];
        }
        var scopedSources = isolateAllSources(sources, convertedScope);
        var sinks = component.apply(void 0, [scopedSources].concat(rest));
        var scopedSinks = isolateAllSinks(sources, sinks, convertedScope);
        return scopedSinks;
    };
}
isolate.reset = function () { return counter = 0; };
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = isolate;

},{}]},{},[1])(1)
});