# Isolate - [source](https://github.com/cyclejs/cyclejs/tree/master/isolate)

A utility function to make scoped dataflow components in Cycle.js.

```
npm install @cycle/isolate
```

See the Cycle.js [documentation on components](http://cycle.js.org/components.html#multiple-instances-of-the-same-component) for a longer explanation of dataflow components.

## What isolation does

Cycle.js components communicate through named source and sink channels such as
`DOM`, `HTTP`, and `state`. If you use the same component more than once, those
instances can otherwise listen to the same DOM events, receive the same HTTP
responses, or update the same state branch.

`isolate(Component, scope)` creates a wrapped component that:

- calls `source.isolateSource(source, scope)` before the component receives each
  source, when the source supports isolation
- calls `source.isolateSink(sink, scope)` on the component's sinks before they
  are returned to the parent
- leaves channels unchanged when their source does not implement isolation

The exact meaning of a scope belongs to each driver. For the DOM driver it
creates a DOM selection namespace. For the HTTP driver it tags requests and
filters responses. For Cycle State it selects and updates a branch of the state
tree.

## Basic example

This counter can be used many times because each isolated instance receives its
own DOM scope:

```js
import isolate from '@cycle/isolate';
import xs from 'xstream';
import {button, div} from '@cycle/dom';

function Counter(sources) {
  const add$ = sources.DOM.select('.add').events('click').mapTo(1);
  const subtract$ = sources.DOM.select('.subtract').events('click').mapTo(-1);

  const count$ = xs.merge(add$, subtract$)
    .fold((count, change) => count + change, 0);

  return {
    DOM: count$.map(count =>
      div([
        button('.subtract', '-'),
        String(count),
        button('.add', '+'),
      ])
    ),
  };
}

function main(sources) {
  const FirstCounter = isolate(Counter, 'first');
  const SecondCounter = isolate(Counter, 'second');

  const first = FirstCounter(sources);
  const second = SecondCounter(sources);

  return {
    DOM: xs.combine(first.DOM, second.DOM).map(([firstCounter, secondCounter]) =>
      div([
        firstCounter,
        secondCounter,
      ])
    ),
  };
}
```

Without isolation, both counters would use the same `.add` and `.subtract`
selectors and clicks in one counter could affect the other.

## Automatic scopes

If you omit the second argument, `isolate()` generates a unique scope:

```js
const FirstCounter = isolate(Counter);
const SecondCounter = isolate(Counter);
```

This is convenient when the actual scope value does not matter. It also means
`isolate(Counter)` is not referentially transparent: every call creates a
different scope. Use explicit scopes when you need predictable identity, stable
state branches, or reproducible tests.

```js
const FirstCounter = isolate(Counter, 'first');
const AgainFirstCounter = isolate(Counter, 'first');
```

## Scopes per channel

The `scope` argument can be an object. This lets each source/sink channel use a
different scope:

```js
const child = isolate(Child, {
  DOM: 'profile-card',
  HTTP: 'profile-card',
  state: 'profile',
})(sources);
```

Use `null` to opt a channel out of isolation:

```js
const child = isolate(Child, {
  DOM: 'profile-card',
  HTTP: null,
})(sources);
```

Use `'*'` as a wildcard for every channel that is not listed explicitly:

```js
const child = isolate(Child, {
  DOM: 'profile-card',
  '*': 'profile-card',
})(sources);
```

## State lenses

Some drivers accept non-string scopes. Cycle State accepts lenses, which let a
child read and update a derived part of a parent state object:

```js
const profileLens = {
  get: state => state.user.profile,
  set: (state, childState) => ({
    ...state,
    user: {
      ...state.user,
      profile: childState,
    },
  }),
};

const profile = isolate(ProfileEditor, {state: profileLens})(sources);
```

Use lenses when the child state does not map cleanly to a single top-level key,
or when two components need different views over the same parent state.

## Driver support

`isolate()` delegates isolation to drivers. A source can support isolation by
exposing two methods:

```js
source.isolateSource(source, scope);
source.isolateSink(sink, scope);
```

If a channel does not provide those methods, `isolate()` passes that channel
through unchanged. This makes it possible to isolate only the channels that need
it.

# API
