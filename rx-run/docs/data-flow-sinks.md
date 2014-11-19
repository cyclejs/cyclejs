# Data Flow Sinks

Sinks are similar to [DataFlowNodes](https://github.com/staltz/cycle/blob/master/docs/data-flow-nodes.md),
except they only receive inputs, they do not produce output. In Rx terminology,
`DataFlowSink` should just subscribe to the input when it is injected. As all other
important components in Cycle.js, a `DataFlowSink` can also be injected a dependency.

## `DataFlowSink` API

**Create** a DataFlowSink by calling `Cycle.createDataFlowSink(definitionFn)` where
`definitionFn` expects Data Flow Nodes as inputs, and outputs an Rx.Disposable
(a subscription to the Observables in the input). The `DataFlowSink` returned by
`createDataFlowSink` contains an `inject` function that can be used in the same style as
DataFlowNode injects are.

**Inject** a dependency into a DataFlowSink by calling `inject(inputs...)`. The inject
simply calls the original `definitionFn` using the given `inputs...`.
