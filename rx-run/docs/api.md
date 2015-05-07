
# `Cycle` object API

- [`applyToDOM`](#applyToDOM)
- [`renderAsHTML`](#renderAsHTML)
- [`registerCustomElement`](#registerCustomElement)
- [`Rx`](#Rx)
- [`h`](#h)

### <a id="applyToDOM"></a> `applyToDOM(container, computer)`

Takes a `computer` function which outputs an Observable of virtual DOM 
elements, and renders that into the DOM element indicated by `container`, 
which can be either a CSS selector or an actual element. At the same time,
provides the `interactions` input to the `computer` function, which is a
collection of all possible events happening on all elements which were
rendered. You must query this collection with 
`interactions.get(selector, eventName)` in order to get an Observable of
interactions of type `eventName` happening on the element identified by 
`selector`.
Example: `interactions.get('.mybutton', 'click').map(ev => ...)`

#### Arguments:

- `container :: String|HTMLElement` the DOM selector for the element (or the element itself) to contain the rendering of the VTrees.
- `computer :: Function` a function that takes `interactions` as input and outputs an Observable of virtual DOM elements.

#### Return:

*(Object)* an object containing properties `rootElem$`, `interactions`, `dispose()` that can be used for debugging or testing.

- - -

### <a id="renderAsHTML"></a> `renderAsHTML(vtree$)`

Converts a given Observable of virtual DOM elements (`vtree$`) into an 
Observable of corresponding HTML strings (`html$`). The provided `vtree$` 
must complete (must call onCompleted on its observers) in finite time, 
otherwise the output `html$` will never emit an HTML string.

#### Arguments:

- `vtree$ :: RxObservable` Observable of virtual DOM elements.

#### Return:

*(Rx.Observable)* an Observable emitting a string as the HTML renderization of the virtual DOM element.

- - -

### <a id="registerCustomElement"></a> `registerCustomElement(tagName, definitionFn)`

Informs Cycle to recognize the given `tagName` as a custom element 
implemented as the given function whenever `tagName` is used in VTrees
rendered in the context of some parent (in `applyToDOM` or in other custom 
elements).
The given `definitionFn` function takes two parameters as input, in this order: 
`interactions` and `properties`. The former works just like it does in the
`computer` function given to `applyToDOM`, and the later contains 
Observables representing properties of the custom element, given from the
parent context. `properties.get('foo')` will return the Observable `foo$`.

The `definitionFn` must output an object containing the property `vtree$` 
as an Observable. If the output object contains other Observables, then
they are treated as custom events of the custom element.

#### Arguments:

- `tagName :: String` a name for identifying the custom element.
- `definitionFn :: Function` the implementation for the custom element. This function takes two arguments: `interactions`, and `properties`, and
should output an object of Observables.

- - -

### <a id="Rx"></a> `Rx`

A shortcut to the root object of [RxJS](https://github.com/Reactive-Extensions/RxJS).

- - -

### <a id="h"></a> `h`

A shortcut to [virtual-hyperscript](
https://github.com/Matt-Esch/virtual-dom/tree/master/virtual-hyperscript).
This is a helper for creating VTrees in Views.
