
# `Cycle` object API

- [`createStream`](#createStream)
- [`render`](#render)
- [`registerCustomElement`](#registerCustomElement)
- [`vdomPropHook`](#vdomPropHook)
- [`Rx`](#Rx)
- [`h`](#h)

### <a id="createStream"></a> `createStream(definitionFn)`

Creates a Cycle stream defined by `definitionFn`. A Stream is a subclass of
Rx.Observable and implements "Injectable", so it contains the function
`inject(...inputs)`. This function will synchronously return the same Observable as
`definitionFn` returns, but will use proxy inputs created internally. You should
supply the real inputs later with inject(), and the proxy inputs will imitate the
behavior of the real inputs.

#### Arguments:

- `definitionFn :: Function` a function taking Observables as input and outputting one Rx.Observable.

#### Return:

*(Rx.Observable)* a stream as defined by the return of `definitionFn`.

- - -

### <a id="render"></a> `render(vtree$, container)`

Renders a stream of virtual DOM elements (`vtree$`) into the DOM element indicated
by `container`, which can be either a CSS selector or an actual element.
Returns a stream of real DOM element, with a special property attached to it called
`interactions$()`. This `interactions$` is a theoretical stream containing all
possible events happening on all elements which were rendered. You must query it
with `interactions$.choose(selector, eventName)` in order to get an event stream of
interactions of type `eventName` happening on the element identified by `selector`.
Example: `interactions$.choose('.mybutton', 'click').subscribe( ... )`

#### Arguments:

- `vtree$ :: RxObservable` stream of virtual DOM elements.
- `container :: String|HTMLElement` the DOM selector for the element (or the element itself) to contain the rendering of the VTrees.

#### Return:

*(Rx.Observable)* a stream emitting the root DOM element for this rendering, with the property `interactions$()` attached to it.

- - -

### <a id="registerCustomElement"></a> `registerCustomElement(tagName, definitionFn)`

Informs Cycle to recognize the given `tagName` as a custom element implemented
as `dataFlowNode` whenever `tagName` is used in VTrees in a View rendered to a
DOMUser.
The given `dataFlowNode` must export a `vtree$` Observable. If the `dataFlowNode`
expects Observable `foo$` as input, then the custom element's attribute named `foo`
will be injected automatically into `foo$`.

#### Arguments:

- `tagName :: String` a name for identifying the custom element.
- `definitionFn :: Function` the implementation for the custom element. This function takes two arguments: `User`, and `Properties`. Use `User` to inject into an
Intent and to be injected a View. `Properties` is a DataFlowNode containing
observables matching the custom element properties.

- - -

### <a id="vdomPropHook"></a> `vdomPropHook(fn)`

Returns a hook for manipulating an element from the real DOM. This is a helper for
creating VTrees in Views. Useful for calling `focus()` on the DOM element, or doing
similar mutations.

See https://github.com/Raynos/mercury/blob/master/docs/faq.md for more details.

#### Arguments:

- `fn :: Function` a function with two arguments: `element`, `property`.

#### Return:

*(PropertyHook)* a hook

- - -

### <a id="Rx"></a> `Rx`

A shortcut to the root object of [RxJS](https://github.com/Reactive-Extensions/RxJS).

- - -

### <a id="h"></a> `h`

A shortcut to [virtual-hyperscript](
https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript).
This is a helper for creating VTrees in Views.
