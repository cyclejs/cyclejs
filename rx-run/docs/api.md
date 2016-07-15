
# Cycle Run API with RxJS v4

- [`run`](#run)
- [`Cycle`](#Cycle)

### <a id="run"></a> `run(main, drivers)`

Takes a `main` function and circularly connects it to the given collection
of driver functions.

**Example:**
```js
import {run} from '@cycle/rx-run';
const dispose = Cycle.run(main, drivers);
// ...
dispose();
```

The `main` function expects a collection of "source" Observables (returned
from drivers) as input, and should return a collection of "sink" Observables
(to be given to drivers). A "collection of Observables" is a JavaScript
object where keys match the driver names registered by the `drivers` object,
and values are the Observables. Refer to the documentation of each driver to
see more details on what types of sources it outputs and sinks it receives.

#### Arguments:

- `main: Function` a function that takes `sources` as input and outputs a collection of `sinks` Observables.
- `drivers: Object` an object where keys are driver names and values are driver functions.

#### Return:

*(Function)* a dispose function, used to terminate the execution of the Cycle.js program, cleaning up resources used.

- - -

### <a id="Cycle"></a> `Cycle(main, drivers)`

A function that prepares the Cycle application to be executed. Takes a `main`
function and prepares to circularly connects it to the given collection of
driver functions. As an output, `Cycle()` returns an object with three
properties: `sources`, `sinks` and `run`. Only when `run()` is called will
the application actually execute. Refer to the documentation of `run()` for
more details.

**Example:**
```js
import Cycle from '@cycle/rx-run';
const {sources, sinks, run} = Cycle(main, drivers);
// ...
const dispose = run(); // Executes the application
// ...
dispose();
```

#### Arguments:

- `main: Function` a function that takes `sources` as input and outputs a collection of `sinks` Observables.
- `drivers: Object` an object where keys are driver names and values are driver functions.

#### Return:

*(Object)* an object with three properties: `sources`, `sinks` and `run`. `sources` is the collection of driver sources, `sinks` is the
collection of driver sinks, these can be used for debugging or testing. `run`
is the function that once called will execute the application.

