
# `Cycle` object API

- [`createDataFlowNode`](#createDataFlowNode)
- [`createDataFlowSource`](#createDataFlowSource)
- [`createDataFlowSink`](#createDataFlowSink)
- [`createModel`](#createModel)
- [`createView`](#createView)
- [`createIntent`](#createIntent)
- [`createRenderer`](#createRenderer)
- [`registerCustomElement`](#registerCustomElement)
- [`vdomPropHook`](#vdomPropHook)
- [`Rx`](#Rx)
- [`h`](#h)

### <a id="createDataFlowNode"></a> `createDataFlowNode(definitionFn)`

Creates a DataFlowNode based on the given `definitionFn`. The `definitionFn`
function will be executed immediately on create, and the resulting DataFlowNode
outputs will be synchronously available. The inputs are asynchronously injected
later with the `inject()` function on the DataFlowNode.

#### Arguments:

- `definitionFn :: Function` a function expecting DataFlowNodes as parameters. This function should return an object containing RxJS Observables as properties.
The input parameters can also be plain objects with Observables as properties.

#### Return:

*(DataFlowNode)* a DataFlowNode, containing a `inject(inputs...)` function.

- - -

### <a id="createDataFlowSource"></a> `createDataFlowSource(outputObject)`

Creates a DataFlowSource. It receives an object as argument, and outputs that same
object, annotated as a DataFlowSource. For all practical purposes, a DataFlowSource
is just a regular object with RxJS Observables, but for consistency with other
components in the framework such as DataFlowNode, the returned object is an instance
of DataFlowSource.

#### Arguments:

- `outputObject :: Object` an object containing RxJS Observables.

#### Return:

*(DataFlowSource)* a DataFlowSource equivalent to the given outputObject

- - -

### <a id="createDataFlowSink"></a> `createDataFlowSink(definitionFn)`

Creates a DataFlowSink, given a definition function that receives injected inputs.

#### Arguments:

- `definitionFn :: Function` a function expecting some DataFlowNode(s) as arguments. The function should subscribe to Observables of the input DataFlowNodes
and should return a `Rx.Disposable` subscription.

#### Return:

*(DataFlowSink)* a DataFlowSink, containing a `inject(inputs...)` function.

- - -

### <a id="createModel"></a> `createModel(definitionFn)`

Returns a DataFlowNode representing a Model, having some Intent as input.

Is a specialized case of `createDataFlowNode()`, with the same API.

#### Arguments:

- `definitionFn :: Function` a function expecting an Intent DataFlowNode as parameter. Should return an object containing RxJS Observables as properties.

#### Return:

*(DataFlowNode)* a DataFlowNode representing a Model, containing a `inject(intent)` function.

- - -

### <a id="createView"></a> `createView(definitionFn)`

Returns a DataFlowNode representing a View, having some Model as input.

Is a specialized case of `createDataFlowNode()`.

#### Arguments:

- `definitionFn :: Function` a function expecting a Model object as parameter. Should return an object containing RxJS Observables as properties. The object **must
contain** property `vtree$`, an Observable emitting instances of VTree
(Virtual DOM elements).

#### Return:

*(DataFlowNode)* a DataFlowNode representing a View, containing a `inject(model)` function.

- - -

### <a id="createIntent"></a> `createIntent(definitionFn)`

Returns a DataFlowNode representing an Intent, having some View as input.

Is a specialized case of `createDataFlowNode()`.

#### Arguments:

- `definitionFn :: Function` a function expecting a View object as parameter. Should return an object containing RxJS Observables as properties.

#### Return:

*(DataFlowNode)* a DataFlowNode representing an Intent, containing a `inject(view)` function.

- - -

### <a id="createRenderer"></a> `createRenderer(container)`

Returns a Renderer (a DataFlowSink) bound to a DOM container element. Contains an
`inject` function that should be called with a View as argument.

#### Arguments:

- `container :: String|HTMLElement` the DOM selector for the element (or the element itself) to contain the rendering of the VTrees.

#### Return:

*(Renderer)* a Renderer object containing an `inject(view)` function.

- - -

### <a id="registerCustomElement"></a> `registerCustomElement(tagName, dataFlowNode)`

Informs Cycle to recognize the given `tagName` as a custom element implemented
as `dataFlowNode` whenever `tagName` is used in VTrees in a rendered View.
The given `dataFlowNode` must export a `vtree$` Observable. If the `dataFlowNode`
expects Observable `foo$` as input, then the custom element's attribute named `foo`
will be injected automatically into `foo$`.

#### Arguments:

- `tagName :: String` a name for identifying the custom element.
- `dataFlowNode :: DataFlowNode` the implementation of the custom element.

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
