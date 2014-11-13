# `Cycle` object API

- [`defineBackwardFunction`](#defineBackwardFunction)
- [`defineModel`](#defineModel)
- [`defineView`](#defineView)
- [`defineIntent`](#defineIntent)
- [`h`](#h)
- [`link`](#link)
- [`renderEvery`](#renderEvery)

## <a id="defineBackwardFunction"></a> `defineBackwardFunction([inputInterface], definitionFn)`

Returns a Backward Function. `inputInterface` is an array of strings, defining which
Observables are expected to exist in the input. It is useful for defining the 'type' of
the input, since JavaScript has no strong types. The `inputInterface` is optional if the
Backward Function does not have any input. In that case, the function `definitionFn`
should not have any parameter either.

#### Arguments

- `[inputInterface]` *(Array&lt;String&gt;)*: property names that are expected to exist as
  RxJS Observables in the input parameter for `definitionFn`.
- `definitionFn` *(Function)*: a function expecting an object as parameter, satisfying the
  type requirement given by `inputInterface`. Should return an object containing RxJS
  Observables as properties.

#### Returns

*(BackwardFunction)*: a Backward Function, containing a `inject(input)` function.

## <a id="defineModel"></a> `defineModel([intentInterface], definitionFn)`

Returns a Backward Function representing a Model, having some Intent as input. Is a
specialized case of `defineBackwardFunction()`.

#### Arguments

- `[intentInterface]` *(Array&lt;String&gt;)*: property names that are expected to exist as
  RxJS Observables in the input Intent.
- `definitionFn` *(Function)*: a function expecting an Intent object as parameter. Should
  return an object containing RxJS Observables as properties.

#### Returns

*(BackwardFunction)*: a Backward Function representing a Model, containing a
`inject(intent)` function.

## <a id="defineView"></a> `defineView([modelInterface], definitionFn)`

Returns a Backward Function representing a View, having some Model as input. Is a
specialized case of `defineBackwardFunction()`.

#### Arguments

- `[modelInterface]` *(Array&lt;String&gt;)*: property names that are expected to exist as
  RxJS Observables in the input Model.
- `definitionFn` *(Function)*: a function expecting a Model object as parameter. Should
  return an object containing RxJS Observables as properties. The object **must contain**
  two properties: `vtree$` and `events`. The value of `events` must be an array of strings
  with the names of the Observables that carry DOM events. `vtree$` should be an
  Observable emitting instances of VTree (Virtual DOM elements).

#### Returns

*(BackwardFunction)*: a Backward Function representing a View, containing a
`inject(model)` function.

## <a id="defineIntent"></a> `defineIntent([viewInterface], definitionFn)`

Returns a Backward Function representing an Intent, having some View as input. Is a
specialized case of `defineBackwardFunction()`.

#### Arguments

- `[viewInterface]` *(Array&lt;String&gt;)*: property names that are expected to exist as
  RxJS Observables in the input View.
- `definitionFn` *(Function)*: a function expecting a View object as parameter. Should
  return an object containing RxJS Observables as properties.

#### Returns

*(BackwardFunction)*: a Backward Function representing an Intent, containing a
`inject(view)` function.

## <a id="h"></a> `h`

A shortcut to [virtual-hyperscript](https://github.com/Raynos/virtual-hyperscript). This
is a helper for creating VTrees in Views.

## <a id="link"></a> `link(model, view, intent)`

Ties together the given `model`, `view`, `intent`, making them be circular dependencies to
each other, calling `inject()` on each of these Backward Functions.

#### Arguments

- `model` *(BackwardFunction)*: a Model component.
- `view` *(BackwardFunction)*: a View component.
- `intent` *(BackwardFunction)*: an Intent component.

#### Returns

Nothing.

## <a id="renderEvery"></a> `renderEvery(vtree$, containerSelector)`

Renders every virtual element emitted by `vtree$` into the first DOM element
matched by `containerSelector`.

#### Arguments

- `vtree$` *(Rx.Observable&lt;VTree&gt;)*: an Observable of VTree instances (virtual DOM
  elements).
- `containerSelector` *(String|HTMLElement)*: the DOM selector for the element (or the
  element itself) to contain the rendering of the VTrees.

#### Returns

*(Rx.Disposable)*: a subscription to the `vtree$` Observable.
