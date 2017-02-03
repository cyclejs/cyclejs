# Cycle History

This is the standard Cycle.js driver for dealing with the History API.

This project is 100% compatible with mjackson/history, most notably used to create React-Router. This allows for a Cycle.js application to be embedded inside of an existing React application and share history instances.

Though this library makes use of the interface that the mjackson/history library provides, any other library can be used which satisfies the interface. Also take note of the ServerHistory object we have made to easily allow for server-side rendering of your Cycle application.

```
npm install @cycle/history
```

# API

- [`captureClicks`](#captureClicks)
- [`makeHistoryDriver`](#makeHistoryDriver)
- [`makeHashHistoryDriver`](#makeHashHistoryDriver)
- [`makeHashHistoryDriver`](#makeHashHistoryDriver)

### <a id="captureClicks"></a> `captureClicks(driver)`

Wraps a History Driver to add "click capturing" functionality.

If you want to intercept and handle any click event that leads to a link,
like on an `<a>` element, you pass your existing driver (e.g. created from
`makeHistoryDriver()`) as argument and this function will return another
driver of the same nature, but including click capturing logic.

#### Arguments:

- `driver: Function` an existing History Driver function.

#### Return:

*(Function)* a History Driver function

- - -

### <a id="makeHistoryDriver"></a> `makeHistoryDriver(options)`

Create a History Driver to be used in the browser.

This is a function which, when called, returns a History Driver for Cycle.js
apps. The driver is also a function, and it takes a stream of new locations
(strings representing pathnames or location objects) as input, and outputs
another stream of locations that were applied.

#### Arguments:

- `options: object` an object with some options specific to this driver. These options are the same as for the corresponding
`createBrowserHistory()` function in History v4. Check its
[docs](https://github.com/mjackson/history/tree/v4.5.1#usage) for a good
description on the options.

#### Return:

*(Function)* the History Driver function

- - -

### <a id="makeHashHistoryDriver"></a> `makeHashHistoryDriver(options)`

Create a History Driver for older browsers using hash routing.

This is a function which, when called, returns a History Driver for Cycle.js
apps. The driver is also a function, and it takes a stream of new locations
(strings representing pathnames or location objects) as input, and outputs
another stream of locations that were applied.

#### Arguments:

- `options: object` an object with some options specific to this driver. These options are the same as for the corresponding
`createHashHistory()` function in History v4. Check its
[docs](https://github.com/mjackson/history/tree/v4.5.1#usage) for a good
description on the options.

#### Return:

*(Function)* the History Driver function

- - -

### <a id="makeHashHistoryDriver"></a> `makeHashHistoryDriver(options)`

Create a History Driver to be used in non-browser enviroments such as
server-side Node.js.

This is a function which, when called, returns a History Driver for Cycle.js
apps. The driver is also a function, and it takes a stream of new locations
(strings representing pathnames or location objects) as input, and outputs
another stream of locations that were applied.

#### Arguments:

- `options: object` an object with some options specific to this driver. These options are the same as for the corresponding
`createMemoryHistory()` function in History v4. Check its
[docs](https://github.com/mjackson/history/tree/v4.5.1#usage) for a good
description on the options.

#### Return:

*(Function)* the History Driver function

- - -

