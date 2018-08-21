# Cycle DOM - [source](https://github.com/cyclejs/cyclejs/tree/master/dom)

A Cycle.js driver to enable interaction with the DOM. The driver is based on [snabbdom](https://github.com/paldepind/snabbdom/) as the Virtual DOM library.

```
npm install @cycle/dom
```

## Browser support

These are the browsers we officially test for:

- Chrome 49 and higher
- Firefox 52 and higher
- Safari 9.1 and higher
- Android Chrome (OS version 4.4 and higher)
- iOS Safari (OS version 10.3 and higher)
- Microsoft Edge
- Internet Explorer 11

**Note for Internet Explorer 10:** This driver works on IE10 only if you polyfill ES6 Map, ES6 Set, [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) (we recommend `mutation-observer` package from npm) **and** if you don't render the app in a [DocumentFragment](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment).

In other browsers, the DOM driver may not work or may work partially.

# Isolation semantics

Cycle DOM supports isolation between components using the `@cycle/isolate` package. Here is how isolation contexts work in Cycle DOM given a `scope` to `isolate(Component, scope)`:

**When the scope is the `':root'` string: no isolation.**

The child component will have run in the same context as its parent, and methods like `DOMSource.select()` will inspect the DOM trees of the parent. This means the child component is able to inspect DOM trees that it did not itself produce.

**When the scope is a selector string (e.g. '.foo' or '#foo'): siblings isolation.**

A `DOMSource.select()` call in a parent component will have access to the DOM trees in both children isolated with "siblings isolation" (which means there is no parent-child isolation). However, a `DOMSource.select()` inside a child component isolated with "siblings isolation" will have no access to the DOM trees in other children components isolated with "siblings isolation".

**When the scope is any other string: total isolation.**

A `DOMSource.select()` call in a parent component will have no access to the DOM trees in a totally isolated child. Also, sibling components will have no access to the DOM trees in a totally isolated sibling component.

# API
