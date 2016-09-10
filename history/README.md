# Cycle History

This is the standard Cycle.js driver for dealing with the History API.

This project is 100% compatible with mjackson/history, most notably used to create React-Router. This allows for a Cycle.js application to be embedded inside of an existing React application and share history instances.

Though this library makes use of the interface that the mjackson/history library provides, any other library can be used which satisfies the interface. Also take note of the ServerHistory object we have made to easily allow for server-side rendering of your Cycle application.

```
npm install @cycle/history
```

# API

- [`makeHistoryDriver`](#makeHistoryDriver)
- [`createServerHistory`](#createServerHistory)

### <a id="makeHistoryDriver"></a> `makeHistoryDriver(history, options)`

History driver factory

This is a function which, when called, returns a History Driver for Cycle.js
apps. The driver is also a function, and it takes a stream of new locations
(strings representing pathnames or location objects) as input, and outputs
another stream of locations that were applied.

#### Arguments:

- `history: History` the History object created by the history library. This object is usually created through `createBrowserHistory()` or
`createHashHistory()` or `createMemoryHistory()` from the `history` library.
Alternatively, you may use `createServerHistory` from this library.
- `options: object` an object with some options specific to this driver. Options may be: `capture`, a boolean to indicate whether the driver should
intercept and handle any click event that leads to a link, like on an `<a>`
element; `onError`, a callback function that takes an error as argument and
handles it, use this to configure what to do with driver errors.

#### Return:

*(Function)* the History Driver function

- - -

### <a id="createServerHistory"></a> `createServerHistory(location)`

Creates a "ServerHistory" object similar to the History objects that the
`history` library can create. Use this when you want to support server-side
rendering.

#### Arguments:

- `location: string|object` this may be either a string representing the pathname, or a location object with fields like `pathname`, `search`,
`query`, `state`, `action`, `key`, `hash`, etc.

#### Return:

*(object)* a History object.

- - -

