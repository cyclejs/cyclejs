
# `Renderer` API

- [`Cycle.createRenderer`](https://github.com/staltz/cycle/blob/master/docs/api.md#createRenderer)
- [`registerCustomElement`](#registerCustomElement)

### <a id="registerCustomElement"></a> `registerCustomElement(tagName, dataFlowNode)`

Informs the Renderer to recognize the given `tagName` as a custom element implemented
as `dataFlowNode`, whenever `tagName` is used in VTrees in View given as input to
this Renderer. The given `dataFlowNode` must export a `vtree$` Observable. If the
`dataFlowNode` expects Observable `foo$` as input, then the custom element's attribute
named `foo` will be injected automatically by the Renderer into `foo$`.

#### Arguments:

- `tagName :: String` a name for identifying the custom element.
- `dataFlowNode :: DataFlowNode` the implementation of the custom element.
