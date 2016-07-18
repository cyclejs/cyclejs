# Cycle DOM

A collection of Cycle.js drivers to enable interaction with the DOM. It includes a DOM Driver, an HTML Driver, both based on [snabbdom](https://github.com/paldepind/snabbdom/) as the Virtual DOM library.

```
npm install @cycle/dom
```

## Browser support

These are the browsers we officially support currently. Cycle.js may not work (or work partially) in other browsers.

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-dom.svg)](https://saucelabs.com/u/cyclejs-dom)

# API


- [`makeDOMDriver`](#makeDOMDriver)
- [`makeHTMLDriver`](#makeHTMLDriver)
- [`mockDOMSource`](#mockDOMSource)
- [`h`](#h)

### <a id="makeDOMDriver"></a> `makeDOMDriver(container, options)`

A factory for the DOM driver function.

Takes a `container` to define the target on the existing DOM which this
driver will operate on, and an `options` object as the second argument. The
input to this driver is a stream of virtual DOM objects, or in other words,
Snabbdom "VNode" objects. The output of this driver is a "DOMSource": a
collection of Observables queried with the methods `select()` and `events()`.

`DOMSource.select(selector)` returns a new DOMSource with scope restricted to
the element(s) that matches the CSS `selector` given.

`DOMSource.events(eventType, options)` returns a stream of events of
`eventType` happening on the elements that match the current DOMSource. The
returned stream is an *xstream* Stream if you use `@cycle/xstream-run` to run
your app with this driver, or it is an RxJS Observable if you use
`@cycle/rxjs-run`, and so forth. The `options` parameter can have the field
`useCapture`, which is by default `false`, except it is `true` for event
types that do not bubble. Read more here
https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
about the `useCapture` and its purpose.

`DOMSource.elements()` returns a stream of the DOM element(s) matched by the
selectors in the DOMSource. Also, `DOMSource.select(':root').elements()`
returns a stream of DOM element corresponding to the root (or container) of
the app on the DOM.

#### Arguments:

- `container: String|HTMLElement` the DOM selector for the element (or the element itself) to contain the rendering of the VTrees.
- `options: DOMDriverOptions` an object with two optional fields: `transposition: boolean` enables/disables transposition of inner streams in
the virtual DOM tree, `modules: array` contains additional Snabbdom modules.

#### Return:

*(Function)* the DOM driver function. The function expects a stream of of VNode as input, and outputs the DOMSource object.

- - -

### <a id="makeHTMLDriver"></a> `makeHTMLDriver(effect, options)`

A factory for the HTML driver function.

Takes an `effect` callback function and an `options` object as arguments. The
input to this driver is a stream of virtual DOM objects, or in other words,
Snabbdom "VNode" objects. The output of this driver is a "DOMSource": a
collection of Observables queried with the methods `select()` and `events()`.

The HTML Driver is supplementary to the DOM Driver. Instead of producing
elements on the DOM, it generates HTML as strings and does a side effect on
those HTML strings. That side effect is described by the `effect` callback
function. So, if you want to use the HTML Driver on the server-side to render
your application as HTML and send as a response (which is the typical use
case for the HTML Driver), you need to pass something like the
`html => response.send(html)` function as the `effect` argument. This way,
the driver knows what side effect to cause based on the HTML string it just
rendered.

The HTML driver is useful only for that side effect in the `effect` callback.
It can be considered a sink-only driver. However, in order to serve as a
transparent replacement to the DOM Driver when rendering from the server, the
HTML driver returns a source object that behaves just like the DOMSource.
This helps reuse the same application that is written for the DOM Driver.
This fake DOMSource returns empty streams when you query it, because there
are no user events on the server.

`DOMSource.select(selector)` returns a new DOMSource with scope restricted to
the element(s) that matches the CSS `selector` given.

`DOMSource.events(eventType, options)` returns an empty stream. The returned
stream is an *xstream* Stream if you use `@cycle/xstream-run` to run your app
with this driver, or it is an RxJS Observable if you use `@cycle/rxjs-run`,
and so forth.

`DOMSource.elements()` returns the stream of HTML string rendered from your
sink virtual DOM stream.

#### Arguments:

- `effect: Function` a callback function that takes a string of rendered HTML as input and should run a side effect, returning nothing.
- `options: HTMLDriverOptions` an object with one optional field: `transposition: boolean` enables/disables transposition of inner streams in
the virtual DOM tree.

#### Return:

*(Function)* the HTML driver function. The function expects a stream of of VNode as input, and outputs the DOMSource object.

- - -

### <a id="mockDOMSource"></a> `mockDOMSource(mockConfig)`

A factory function to create mocked DOMSource objects, for testing purposes.

Takes a `streamAdapter` and a `mockConfig` object as arguments, and returns
a DOMSource that can be given to any Cycle.js app that expects a DOMSource in
the sources, for testing.

The `streamAdapter` parameter is a package such as `@cycle/xstream-adapter`,
`@cycle/rxjs-adapter`, etc. Import it as `import a from '@cycle/rx-adapter`,
then provide it to `mockDOMSource. This is important so the DOMSource created
knows which stream library should it use to export its streams when you call
`DOMSource.events()` for instance.

The `mockConfig` parameter is an object specifying selectors, eventTypes and
their streams. Example:

```js
const domSource = mockDOMSource(RxAdapter, {
  '.foo': {
    'click': Rx.Observable.of({target: {}}),
    'mouseover': Rx.Observable.of({target: {}}),
  },
  '.bar': {
    'scroll': Rx.Observable.of({target: {}}),
    elements: Rx.Observable.of({tagName: 'div'}),
  }
});

// Usage
const click$ = domSource.select('.foo').events('click');
const element$ = domSource.select('.bar').elements();
```

The mocked DOM Source supports isolation. It has the functions `isolateSink`
and `isolateSource` attached to it, and performs simple isolation using
classNames. *isolateSink* with scope `foo` will append the class `___foo` to
the stream of virtual DOM nodes, and *isolateSource* with scope `foo` will
perform a conventional `mockedDOMSource.select('.__foo')` call.

#### Arguments:

- `mockConfig: Object` an object where keys are selector strings and values are objects. Those nested objects have `eventType` strings as keys
and values are streams you created.

#### Return:

*(Object)* fake DOM source object, with an API containing `select()` and `events()` and `elements()` which can be used just like the DOM Driver's
DOMSource.

- - -

### <a id="h"></a> `h()`

The hyperscript function `h()` is a function to create virtual DOM objects,
also known as VNodes. Call

```js
h('div.myClass', {style: {color: 'red'}}, [])
```

to create a VNode that represents a `DIV` element with className `myClass`,
styled with red color, and no children because the `[]` array was passed. The
API is `h(tagOrSelector, optionalData, optionalChildrenOrText)`.

However, usually you should use "hyperscript helpers", which are shortcut
functions based on hyperscript. There is one hyperscript helper function for
each DOM tagName, such as `h1()`, `h2()`, `div()`, `span()`, `label()`,
`input()`. For instance, the previous example could have been written
as:

```js
div('.myClass', {style: {color: 'red'}}, [])
```

There are also SVG helper functions, which apply the appropriate SVG
namespace to the resulting elements. `svg()` function creates the top-most
SVG element, and `svg.g`, `svg.polygon`, `svg.circle`, `svg.path` are for
SVG-specific child elements. Example:

```js
svg({width: 150, height: 150}, [
  svg.polygon({
    attrs: {
      class: 'triangle',
      points: '20 0 20 150 150 20'
    }
  })
])
```

- - -

