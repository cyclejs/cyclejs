
# `isolate` API

- [`isolate`](#isolate)

### <a id="isolate"></a> `isolate(dataflowComponent, scope)`

Takes a `dataflowComponent` function and an optional `scope` string, and
returns a scoped version of the `dataflowComponent` function.

When the scoped dataflow component is invoked, each source provided to the
scoped dataflowComponent is isolated to the scope using
`source.isolateSource(source, scope)`, if possible. Likewise, the sinks
returned from the scoped dataflow component are isolate to the scope using
`source.isolateSink(sink, scope)`.

If the `scope` is not provided, a new scope will be automatically created.
This means that **`isolate(dataflowComponent)` is impure** (not referentially
transparent). Two calls to `isolate(Foo)` will generate two distinct dataflow
components.

Note that both `isolateSource()` and `isolateSink()` are static members of
`source`. The reason for this is that drivers produce `source` while the
application produces `sink`, and it's the driver's responsibility to
implement `isolateSource()` and `isolateSink()`.

#### Arguments:

- `dataflowComponent :: Function` a function that takes `sources` as input and outputs a collection of `sinks`.
- `scope :: String` an optional string that is used to isolate each `sources` and `sinks` when the returned scoped dataflow component is invoked.

#### Return:

*(Function)* the scoped dataflow component function that, as the original `dataflowComponent` function, takes `sources` and returns `sinks`.

- - -

