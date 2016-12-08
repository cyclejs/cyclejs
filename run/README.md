# Run() for xstream

Cycle.js `run(main, drivers)` function for applications written with xstream.

```
npm install @cycle/run xstream
```

**Note: `xstream` package is required too.**

## Basic usage

```js
import {run} from '@cycle/run'

run(main, drivers)
```

# API

- [`setup`](#setup)
- [`run`](#run)

### <a id="setup"></a> `setup(main, drivers)`

A function that prepares the Cycle application to be executed. Takes a `main`
function and prepares to circularly connects it to the given collection of
driver functions. As an output, `setup()` returns an object with three
properties: `sources`, `sinks` and `run`. Only when `run()` is called will
the application actually execute. Refer to the documentation of `run()` for
more details.

**Example:**
```js
import {setup} from '@cycle/run';
const {sources, sinks, run} = Cycle(main, drivers);
// ...
const dispose = run(); // Executes the application
// ...
dispose();
```

#### Arguments:

- `main: Function` a function that takes `sources` as input and outputs `sinks`.
- `drivers: Object` an object where keys are driver names and values are driver functions.

#### Return:

*(Object)* an object with three properties: `sources`, `sinks` and `run`. `sources` is the collection of driver sources, `sinks` is the
collection of driver sinks, these can be used for debugging or testing. `run`
is the function that once called will execute the application.

- - -

### <a id="run"></a> `run(main, drivers)`

Takes a `main` function and circularly connects it to the given collection
of driver functions.

**Example:**
```js
import run from '@cycle/run';
const dispose = run(main, drivers);
// ...
dispose();
```

The `main` function expects a collection of "source" streams (returned from
drivers) as input, and should return a collection of "sink" streams (to be
given to drivers). A "collection of streams" is a JavaScript object where
keys match the driver names registered by the `drivers` object, and values
are the streams. Refer to the documentation of each driver to see more
details on what types of sources it outputs and sinks it receives.

#### Arguments:

- `main: Function` a function that takes `sources` as input and outputs `sinks`.
- `drivers: Object` an object where keys are driver names and values are driver functions.

#### Return:

*(Function)* a dispose function, used to terminate the execution of the Cycle.js program, cleaning up resources used.

- - -

