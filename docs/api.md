
# `Cycle` object API

- [`run`](#run)
- [`makeDOMDriver`](#makeDOMDriver)
- [`renderAsHTML`](#renderAsHTML)
- [`Rx`](#Rx)
- [`h`](#h)
- [`svg`](#svg)

### <a id="run"></a> `run(app, drivers)`

Takes an `app` function and circularly connects it to the given collection
of driver functions.

The `app` function expects a collection of "driver response" Observables as
input, and should return a collection of "driver request" Observables.
The driver response collection can be queried using a getter function:
`responses.get(driverName, ...params)`, returns an Observable. The
structure of `params` is defined by the API of the corresponding
`driverName`. The driver request collection should be a simple object where
keys match the driver names used by `responses.get()` and defined on the
second parameter given to `run()`.

#### Arguments:

- `app :: Function` a function that takes `responses` as input and outputs a collection of `requests` Observables.
- `drivers :: Object` an object where keys are driver names and values are driver functions.

#### Return:

*(Array)* an array where the first object is the collection of driver requests, and the second objet is the collection of driver responses, that
can be used for debugging or testing.

- - -

### <a id="makeDOMDriver"></a> `makeDOMDriver(container, a)`

A factory for the DOM driver function. Takes a `container` to define the
target on the existing DOM which this driver will operate on. All custom
elements which this driver can detect should be given as the second
parameter.

#### Arguments:

- `container :: String|HTMLElement` the DOM selector for the element (or the element itself) to contain the rendering of the VTrees.
- `a :: Object` collection of custom element definitions. The key of each property should be the tag name of the custom element, and the value should
be a function defining the implementation of the custom element. This
function follows the same contract as the top-most `app` function: input
are driver responses, output are requests to drivers.

#### Return:

*(Function)* the DOM driver function. The function expects an Observable of VTree as input, and outputs the response object for this
driver, containing functions `get()` and `dispose()` that can be used for
debugging and testing.

- - -

### <a id="renderAsHTML"></a> `renderAsHTML(a)`

A factory for the HTML driver function. Takes the registry object of all
custom elements as the only parameter. The HTML driver function will use
the custom element registry to detect custom element on the VTree and apply
their implementations.

#### Arguments:

- `a :: Object` collection of custom element definitions. The key of each property should be the tag name of the custom element, and the value should
be a function defining the implementation of the custom element. This
function follows the same contract as the top-most `app` function: input
are driver responses, output are requests to drivers.

#### Return:

*(Function)* the HTML driver function. The function expects an Observable of Virtual DOM elements as input, and outputs the response
object for this driver, containing functions `get()` and `dispose()` that
can be used for debugging and testing. To get the Observable of strings as
the HTML renderization of the virtual DOM elements, call simply
`get(htmlDriverName)` on the responses object returned by Cycle.run();

- - -

### <a id="Rx"></a> `Rx`

A shortcut to the root object of
[RxJS](https://github.com/Reactive-Extensions/RxJS).

- - -

### <a id="h"></a> `h`

A shortcut to [virtual-hyperscript](
https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript).
This is a helper for creating VTrees in Views.

- - -

### <a id="svg"></a> `svg`

A shortcut to the svg hyperscript function.
