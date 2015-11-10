
# `Cycle` object API

- [`run`](#run)

- [`isolate`](#isolate)

### <a id="run"></a> `run(main, drivers)`

Takes an `main` function and circularly connects it to the given collection
of driver functions.

The `main` function expects a collection of "driver source" Observables
as input, and should return a collection of "driver sink" Observables.
A "collection of Observables" is a JavaScript object where
keys match the driver names registered by the `drivers` object, and values
are Observables or a collection of Observables.

#### Arguments:

- `main :: Function` a function that takes `sources` as input and outputs a collection of `sinks` Observables.
- `drivers :: Object` an object where keys are driver names and values are driver functions.

#### Return:

*(Object)* an object with two properties: `sources` and `sinks`. `sinks` is the collection of driver sinks, and `sources` is the collection
of driver sources, that can be used for debugging or testing.

- - -

### <a id="isolate"></a> `isolate(dialogue, scope)`

Takes a `dialogue` function and an optional `scope`, and returns a scoped
`dialogue` function.

When the scoped `dialogue` function is invoked, each source, provided
to the scoped `dialogue`, are attempted called to isolate the source within
the scope. Likewise, the returned sinks from the invocation are also
attempted called to isolate each within the scope.

#### Arguments:

- `dialogue :: Function` a function that takes `sources` as input and outputs a collection of `sinks`.
- `scope :: String` an optional string that are passed to `sources` and `sinks` when the returned scoped `dialogue` is invoked.

#### Return:

*(Function)* the scoped dialogue function that, as the original dialogue function, takes `sources` that will be attempted isolated
and returns `sinks` that will be attempted isolated.

- - -

