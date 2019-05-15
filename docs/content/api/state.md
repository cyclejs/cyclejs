# Cycle State - [source](https://github.com/cyclejs/cyclejs/tree/master/state)

Utility that wraps your Cycle.js main function with reducer-driven state management and a single state atom.

## Installation

```
npm install @cycle/state
```

## Example

```js
import {withState} from '@cycle/state';
// ...

function main(sources) {
  const state$ = sources.state.stream;
  const vdom$ = state$.map(state => /* render virtual DOM here */);

  const initialReducer$ = xs.of(function initialReducer() { return 0; });
  const addOneReducer$ = xs.periodic(1000)
    .mapTo(function addOneReducer(prev) { return prev + 1; });
  const reducer$ = xs.merge(initialReducer$, addOneReducer$);

  return {
    DOM: vdom$,
    state: reducer$,
  };
}

const wrappedMain = withState(main);

run(wrappedMain, {
  DOM: makeDOMDriver('#app'),
});
```

## Overview

**A fractal state management tool for Cycle.js applications.** `withState` creates a wrapped `main` function, where the wrapped result will have a top-level state stream, and will pass that down to the actual `main` function. `withState` is a component wrapper, not a driver. This way, your application state won't live in a driver, because the wrapped `main` is still just a Cycle.js app that can be given to `run`.

**State stream as source, reducer stream as sink.** Your `main` function can expect a `StateSource` object under `sources.state`, and is supposed to return a stream of reducer functions under `sinks.state`.

**One large state tree for your entire application.** All the state in your application should live in the state stream managed internally by Cycle State. Smaller components in your application can access and update pieces of state by interfacing with its parent component with the help of `@cycle/isolate`. The parent gives an isolated state source to its child, and receives an isolated state sink from its child. The parent component interfaces with the grandparent component in the same style. This makes state management [*fractal*](http://staltz.com/unidirectional-user-interface-architectures.html).

**"Fractal"** means that every component in the hierarchy is built in the same way as the top-level `main` function is built. As a consequence, there is no absolute "global" state, since every component treats its state management *relative* to its parent. The top-most component will have `withState` as its parent.

As a consequence, state management is layered like an onion. State streams (sources) will be "peeled off" one layer each time they cross a component input boundary. Reducer streams (sinks) will be stacked one layer each time they cross a component output boundary. For instance, supposing component C is inside B which is inside A:

```js
stateA$ // Emits object `{visitors: {count: 300}}}`
stateB$ // Emits object `{count: 300}`
stateC$ // Emits object `300`

reducerC$ // Emits function `count => count + 1`
reducerB$ // Emits function `visitors => ({count: reducerC(visitors.count)})`
reducerA$ // Emits function `appState => ({visitors: reducerB(appState.visitors)})`
```

## Usage

### How to set up

Import and call `withState` on your `main` function (the top-most component in your app):

```js
import {withState} from '@cycle/state';

function main(sources) {
  // ...
  return sinks;
}

const wrappedMain = withState(main);

run(wrappedMain, drivers);
```

### How to read state and update state

If you have wrapped your `main` function with state, it can now expect to have `sources.state`. This is not a simple stream, it is a "StateSource" object, which is necessary to support isolation. The most important thing to know about this object is that it has the `stream` property. Then, your `main` function can return a stream of reducer functions under `sinks.state`:

```js
function main(sources) {
  // Stream of the state object changing over time
  const state$ = sources.state.stream;

  // Use state$ somehow, for instance, to create vdom$ for the DOM.

  // Stream of reducer. Each emission is a function that describes how
  // state should change.
  const reducer$ = xs.periodic(1000)
    .mapTo(function reducer(prevState) {
      // return new state
    });

  const sinks = {
    state: reducer$, // send these reducers back up
  }

  return sinks;
}
```

### How to initialize state

State is initialized also with a reducer. This is different to Redux and Elm where the initial state is a separate entity. With Cycle State, just create an `initReducer$` and send that to `sinks.state`.

```js
const initReducer$ = xs.of(function initReducer(prevState) {
  // Note that we ignore the prevState argument given,
  // since it's probably undefined anyway
  return {count: 0}; // this is the initial state
});

const reducer$ = xs.merge(initReducer$, someOtherReducer$);

const sinks = {
  state: reducer$,
};
```

### How to compose nested components

To use a child component in another component, where both use Cycle State, you should use the `isolate()` helper function from `@cycle/isolate`. Suppose the shape of state in the parent component is:

```typescript
{
  foo: string,
  bar: number,
  child: {
    count: number,
  },
}
```

The property `child` will host the state for the child component. The parent component needs to isolate the child component under the **scope** `'child'`, then the StateSource and `isolate` will know to pick that property from the parent state object when providing `sources.state` to the child. Then, for any reducer emitted by the child's state sink, `isolate` will wrap that child reducer in a parent reducer that works on the `child` property.

```js
function Parent(sources) {
  const state$ = sources.state.stream; // emits { foo, bar, child }
  const childSinks = isolate(Child, 'child')(sources);

  // ...

  // All these reducers operate on { foo, bar, child } state objects
  const parentReducer$ = xs.merge(initReducer$, someOtherReducer$);
  const childReducer$ = childSinks.state; // even this one
  const reducer$ = xs.merge(parentReducer$, childReducer$);

  return {
    state: reducer$,
    // ...
  }
}
```

Where the child component is:

```js
function Child(sources) {
  const state$ = sources.state.stream; // emits { count }

  // ...

  // These reducers operate on { count } state objects
  const reducer$ = xs.merge(initReducer$, someOtherReducer$);

  return {
    state: reducer$,
    // ...
  }
}
```

When state source crosses the isolation boundary from parent into child, we "peel off" the state object using the isolation *scope*. Then, when crossing the isolation boundary from child back to the parent, we "wrap" the reducer function using the isolation *scope*. This layered structure is called an "onion architecture" in other programming contexts.

### How to provide default state for a nested component

Sometimes the state for the child is given from the parent (what is usually described as "props"), but other times the parent does not pass any state for the child, and the child must initialize its own state.

To accomplish that, we can modify the `initReducer$` of the child component, and turn it into a `defaultReducer$`:

```js
const defaultReducer$ = xs.of(function defaultReducer(prevState) {
  if (typeof prevState === 'undefined') {
    return {count: 0}; // Parent didn't provide state for the child, so initialize it.
  } else {
    return prevState; // Let's just use the state given from the parent.
  }
});
```

It is a good idea to use a `defaultReducer$` instead of an `initialReducer$`, as a rule of thumb.

### How to handle a dynamic list of nested components

The state object tree can have nested state objects, but it can also have nested state arrays. This becomes useful when you are building a list of child components.

Suppose your parent component's state is an array:

```js
function Parent(sources) {
  const array$ = sources.state.stream; // emits [{ count: 0 }, { count: 1 }, ... ]

  // ...

  // This reducer will concat an object every second
  const reducer$ = xs.periodic(1000).map(i => function reducer(prevArray) {
    return prevArray.concat({count: i})
  });

  return {
    state: reducer$,
    // ...
  }
}
```

Each object `{ count: i }` in the array can become the state object for a child component. Cycle State comes with a helper function called `makeCollection` which will utilize the array state stream to infer which children instances should be created, updated, or removed.

`makeCollection` takes a couple of options and returns a normal Cycle.js component (function from sources to sinks). You should specify the child component, a unique identifier for each array element (optional), an isolation scope (optional), and how to combine all children sinks together.

```js
const List = makeCollection({
  item: Child,
  itemKey: (childState, index) => String(index), // or, e.g., childState.key
  itemScope: key => key, // use `key` string as the isolation scope
  collectSinks: instances => {
    return {
      state: instances.pickMerge('state'),
      // ...
    }
  }
})
```

In `collectSinks`, we are given an `instances` object, it is an object that represents all sinks for all children components, and has two helpers to handle them: `pickMerge` and `pickCombine`. These work like the xstream operators `merge` and `combine`, respectively, but operate on a dynamic (growing or shrinking) collection of children instances.

Suppose you want to get all reducers from all children and merge them together. You use `pickMerge` that first "picks" the `state` sink from each child sink (this is similar to lodash [get](https://lodash.com/docs/4.16.4#get) or [pick](https://lodash.com/docs/4.16.4#get)), and then merges all those state sinks together, so the output is a simple stream of reducers.

Then, you can merge the children reducers (`listSinks.state`) with the parent reducers (if there are any), and return those from the parent:

```js
function Parent(sources) {
  const array$ = sources.state.stream;

  const List = makeCollection({
    item: Child,
    itemKey: (childState, index) => String(index),
    itemScope: key => key,
    collectSinks: instances => {
      return {
        state: instances.pickMerge('state'),
        // ...
      }
    }
  });

  const listSinks = List(sources);

  // ...

  const reducer$ = xs.merge(listSinks.state, parentReducer$);

  return {
    state: reducer$,
    // ...
  }
}
```

As `pickMerge` is similar to `merge`, `pickCombine` is similar to `combine` and is useful when combining all children DOM sinks together as one array:

```js
const List = makeCollection({
  item: Child,
  itemKey: (childState, index) => String(index),
  itemScope: key => key,
  collectSinks: instances => {
    return {
      state: instances.pickMerge('state'),
      DOM: instances.pickCombine('DOM')
        .map(itemVNodes => ul(itemVNodes))
    }
  }
});
```

Depending on the type of sink, you may want to use the `merge` strategy or the `combine` strategy. Usually `merge` is used for reducers and `combine` for Virtual DOM streams. In the more general case, `merge` is for events and `combine` is for values-over-time (["signals"](https://github.com/cyclejs/cyclejs/wiki/Understanding-Signals-vs-Events)).

**To add a new child instance**, the parent component just needs to concatenate the state array, like we did with this reducer in the parent:

```js
const reducer$ = xs.periodic(1000).map(i => function reducer(prevArray) {
  return prevArray.concat({count: i})
});
```

**To delete a child instance**, the child component to be deleted can send a reducer which returns undefined. This will tell Cycle State's internals to remove that piece of state from the array, and ultimately delete the child instance and its sinks too.

```js
function Child(sources) {
  // ...

  const deleteReducer$ = deleteAction$.mapTo(function deleteReducer(prevState) {
    return undefined;
  });

  const reducer$ = xs.merge(deleteReducer$, someOtherReducer$);

  return {
    state: reducer$,
    // ...
  };
}
```

See the example code at `examples/advanced` for more details.

### How to share data among components, or compute derived data

There are cases when you need more control over the way the state is passed from parent to child components. The standard mechanism of "peeling off" the state object is not flexible enough in situations such as:

- a component needs access to the same state object as its parent
- a component needs a combination of several pieces of the state object
- you need to manipulate a piece of data before passing it to a component

In such cases you can use *lenses*. The idea of lenses is simple: they provide a view over a data structure, so that the user can see and modify the data through it.

The standard mechanism is already implementing a simple form of lens:

```js
const fooSinks = isolate(Foo, 'foo')(sources);
```
By isolating the component with `'foo'` we are *focusing* on that specific piece of the state object. The same thing can be achieved more explicitly as follows:

```js
const fooLens = {
  get: state => state.foo,
  set: (state, childState) => ({...state, foo: childState})
};

const fooSinks = isolate(Foo, {state: fooLens})(sources);
```

The `fooLens` is composed of a `get` function that extracts the `.foo` sub-state, and a `set` function that returns the updated state whenever the sub-state is modified by the child component. Lenses can be used as scopes in `isolate` thanks to [flexible isolation](https://cycle.js.org/releases.html#flexible-isolation).

A common use case for lenses is sharing data among components. The following lenses give components read/write access to the same `status` value:

```js
// state in the parent: { foo: 3, bar: 8, status: 'ready' }

const fooLens = { //    { val: 3, status: 'ready' }
  get: state => ({val: state.foo, status: state.status}),
  set: (state, childState) => ({...state, foo: childState.val, status: childState.status})
};

const barLens = { //    { val: 8, status: 'ready' }
  get: state => ({val: state.bar, status: state.status}),
  set: (state, childState) => ({...state, bar: childState.val, status: childState.status})
};

const fooSinks = isolate(Child, {state: fooLens})(sources);
const barSinks = isolate(Child, {state: barLens})(sources);
```

Another use case is computing derived data, for example the average of an array of numbers:

```js
// state in the parent: { xs: [23, 12, 25] }

const averageLens = {// { avg: 20 }
  get: state => ({avg: state.xs.reduce((a, b) => a + b, 0) / state.xs.length}),
  set: (state, childState) => state // ignore updates
}
```

### How to choose a different key other than `state`

If you want to choose what key to use in sources and sinks (the default is `state`), pass it as the second argument to `withState`:

```js
function main(sources) {
  // sources.stuff is the StateSource

  return {
    stuff: reducer$, // stream of reducer functions
  };
}

const wrappedMain = withState(main, 'stuff');

Cycle.run(wrappedMain, drivers);
```

### How to use it with TypeScript

We recommend that you export the type `State` for every component. Below is an example of what this usually looks like:

```typescript
export interface State {
  count: number;
  age: number;
  title: string;
}

export interface Sources {
  DOM: DOMSource;
  state: StateSource<State>;
}

export interface Sinks {
  DOM: Stream<VNode>;
  state: Stream<Reducer<State>>;
}

function MyComponent(sources: Sources): Sinks {
  // ...
}
```

The `StateSource` type comes from withState and you can import it as such:

```typescript
import {StateSource} from '@cycle/state';
```

Then, you can compose nested state types in the parent component file:

```typescript
import {State as ChildState} from './Child';

export interface State {
  list: Array<ChildState>;
}
```

See some example code at `examples/advanced` for more details.

# API
