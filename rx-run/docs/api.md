
# `Cycle` object API

- [`run`](#run)

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

