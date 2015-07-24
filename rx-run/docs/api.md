
# `Cycle` object API

- [`run`](#run)
- [`Rx`](#Rx)

### <a id="run"></a> `run(main, drivers)`

Takes an `main` function and circularly connects it to the given collection
of driver functions.

The `main` function expects a collection of "driver response" Observables
as input, and should return a collection of "driver request" Observables.
A "collection of Observables" is a JavaScript object where
keys match the driver names registered by the `drivers` object, and values
are Observables or a collection of Observables.

#### Arguments:

- `main :: Function` a function that takes `responses` as input and outputs a collection of `requests` Observables.
- `drivers :: Object` an object where keys are driver names and values are driver functions.

#### Return:

*(Array)* an array where the first object is the collection of driver requests, and the second object is the collection of driver responses, that
can be used for debugging or testing.

- - -

### <a id="Rx"></a> `Rx`

A shortcut to the root object of
[RxJS](https://github.com/Reactive-Extensions/RxJS).
