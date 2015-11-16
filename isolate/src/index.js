let counter = 0

function newScope() {
  return `cycle${++counter}`
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
function isolate(dataflowComponent, scope = newScope()) {
  if (typeof dataflowComponent !== `function`) {
    throw new Error(`First argument given to isolate() must be a ` +
      `'dataflowComponent' function`)
  }
  if (typeof scope !== `string`) {
    throw new Error(`Second argument given to isolate() must be a ` +
      `string for 'scope'`)
  }
  return function scopedDataflowComponent(sources, ...rest) {
    const scopedSources = {}
    for (let key in sources) {
      if (sources.hasOwnProperty(key) &&
        typeof sources[key].isolateSource === `function`)
      {
        scopedSources[key] = sources[key].isolateSource(sources[key], scope)
      } else if (sources.hasOwnProperty(key)) {
        scopedSources[key] = sources[key]
      }
    }
    const sinks = dataflowComponent(scopedSources, ...rest)
    const scopedSinks = {}
    for (let key in sinks) {
      if (sinks.hasOwnProperty(key) &&
        sources.hasOwnProperty(key) &&
        typeof sources[key].isolateSink === `function`)
      {
        scopedSinks[key] = sources[key].isolateSink(sinks[key], scope)
      } else if (sinks.hasOwnProperty(key)) {
        scopedSinks[key] = sinks[key]
      }
    }
    return scopedSinks
  }
}

module.exports = isolate
