
# `Cycle` object API

- [`createDataFlowNode`](#createDataFlowNode)
- [`createDataFlowSink`](#createDataFlowSink)
- [`createModel`](#createModel)
- [`createView`](#createView)
- [`createIntent`](#createIntent)
- [`createRenderer`](#createRenderer)
- [`circularInject`](#circularInject)
- [`vdomPropHook`](#vdomPropHook)
- [`Rx`](#Rx)
- [`h`](#h)

### <a id="createDataFlowNode"></a> `createDataFlowNode([inputInterface1], ..., definitionFn)`

Creates a DataFlowNode.

`inputInterface1` is an array of strings, defining which  Observables are expected to
exist in the first input. It defines the 'type' of the input, since JavaScript has no
strong types. The `inputInterface1` is optional if the DataFlowNode does not have any
input. In that case, the function `definitionFn` should not have any parameter
either. There can be an arbitrary number of input interfaces, but the number of input
interfaces must match the number of arguments that `definitionFn` has. The arguments
to `definitionFn` are objects that should fulfil the respective interfaces.

#### Arguments:

- `[inputInterface1] :: Array<String>` property names that are expected to exist as RxJS Observables in the first input parameter for `definitionFn`.
- `...`
- `definitionFn :: Function` a function expecting objects as parameters (as many as there are interfaces), satisfying the type requirement given by `inputInterface1`,
`inputInterface2`, etc. Should return an object containing RxJS Observables as
properties.

#### Return:

*(DataFlowNode)* a DataFlowNode, containing a `inject(inputs...)` function.

### <a id="createDataFlowSink"></a> `createDataFlowSink(definitionFn)`

Creates a DataFlowSink, given a definition function that receives injected inputs.

#### Arguments:

- `definitionFn :: Function` a function expecting some DataFlowNode(s) as arguments. The function should subscribe to Observables of the input DataFlowNodes
and should return a `Rx.Disposable` subscription.

#### Return:

*(DataFlowSink)* a DataFlowSink, containing a `inject(inputs...)` function.

### <a id="createModel"></a> `createModel([intentInterface], definitionFn)`

Returns a DataFlowNode representing a Model, having some Intent as input.

Is a specialized case of `createDataFlowNode()`, hence can also receive multiple
interfaces and multiple inputs in `definitionFn`.

#### Arguments:

- `[intentInterface] :: Array<String>` property names that are expected to exist as RxJS Observables in the input Intent.
- `definitionFn :: Function` a function expecting an Intent object as parameter. Should return an object containing RxJS Observables as properties.

#### Return:

*(DataFlowNode)* a DataFlowNode representing a Model, containing a `inject(intent)` function.

### <a id="createView"></a> `createView([modelInterface], definitionFn)`

Returns a DataFlowNode representing a View, having some Model as input.

Is a specialized case of `createDataFlowNode()`, hence can also receive multiple
interfaces and multiple inputs in `definitionFn`.

#### Arguments:

- `[modelInterface] :: Array<String>` property names that are expected to exist as RxJS Observables in the input Model.
- `definitionFn :: Function` a function expecting a Model object as parameter. Should return an object containing RxJS Observables as properties. The object **must
contain** two properties: `vtree$` and `events`. The value of `events` must be an
array of strings with the names of the Observables that carry DOM events. `vtree$`
should be an Observable emitting instances of VTree (Virtual DOM elements).

#### Return:

*(DataFlowNode)* a DataFlowNode representing a View, containing a `inject(model)` function.

### <a id="createIntent"></a> `createIntent([viewInterface], definitionFn)`

Returns a DataFlowNode representing an Intent, having some View as input.

Is a specialized case of `createDataFlowNode()`, hence can also receive multiple
interfaces and multiple inputs in `definitionFn`.

#### Arguments:

- `[viewInterface] :: Array<String>` property names that are expected to exist as RxJS Observables in the input View.
- `definitionFn :: Function` a function expecting a View object as parameter. Should return an object containing RxJS Observables as properties.

#### Return:

*(DataFlowNode)* a DataFlowNode representing an Intent, containing a `inject(view)` function.

### <a id="createRenderer"></a> `createRenderer(container)`

Returns a Renderer (a DataFlowSink) bound to a DOM container element. Contains an
`inject` function that should be called with a View as argument.

#### Arguments:

- `container :: (String|HTMLElement)` the DOM selector for the element (or the element itself) to contain the rendering of the VTrees.

#### Return:

*(Renderer)* a Renderer object containing an `inject(view)` function.

### <a id="circularInject"></a> `circularInject(model, view, intent)`

Ties together the given input DataFlowNodes, making them be circular dependencies
to each other. Calls `inject()` on each of the given DataFlowNodes, in reverse order.
This function can be called with an arbitrary number of inputs, but it is commonly
used for the Model-View-Intent triple of nodes.

#### Arguments:

- `model :: DataFlowNode` a Model node.
- `view :: DataFlowNode` a View node.
- `intent :: DataFlowNode` an Intent node.

### <a id="vdomPropHook"></a> `vdomPropHook(fn)`

Returns a hook for manipulating an element from the real DOM. This is a helper for
creating VTrees in Views. Useful for calling `focus()` on the DOM element, or doing
similar mutations.

See https://github.com/Raynos/mercury/blob/master/docs/faq.md for more details.

#### Arguments:

- `fn :: Function` a function with two arguments: `element`, `property`.

#### Return:

*(PropertyHook)* a hook

### <a id="Rx"></a> `Rx`

A shortcut to the root object of [RxJS](https://github.com/Reactive-Extensions/RxJS).

### <a id="h"></a> `h`

A shortcut to [virtual-hyperscript](https://github.com/Raynos/virtual-hyperscript).
This is a helper for creating VTrees in Views.

