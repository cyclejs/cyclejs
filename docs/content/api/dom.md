# Cycle DOM

A Cycle.js driver to enable interaction with the DOM. The driver is based on [snabbdom](https://github.com/paldepind/snabbdom/) as the Virtual DOM library.

```
npm install @cycle/dom
```

## Browser support

These are the browsers we officially support currently. Cycle.js may not work (or may work partially) in other browsers.

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-dom.svg)](https://saucelabs.com/u/cyclejs-dom)

# Isolation semantics

Cycle DOM supports isolation between components using the `@cycle/isolate` package. Here is how isolation contexts work in Cycle DOM given a `scope` to `isolate(Component, scope)`:

**When the scope is the `':root'` string: no isolation.**

The child component will have run in the same context as its parent, and methods like `DOMSource.select()` will inspect the DOM trees of the parent. This means the child component is able to inspect DOM trees that it did not itself produce.

**When the scope is a selector string (e.g. '.foo' or '#foo'): siblings isolation.**

A `DOMSource.select()` call in a parent component will have access to the DOM trees in both children isolated with "siblings isolation" (which means there is no parent-child isolation). However, a `DOMSource.select()` inside a child component isolated with "siblings isolation" will have no access to the DOM trees in other children components isolated with "siblings isolation".

**When the scope is any other string: total isolation.**

A `DOMSource.select()` call in a parent component will have no access to the DOM trees in a totally isolated child. Also, sibling components will have no access to the DOM trees in a totally isolated sibling component.

# API
