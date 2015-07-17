
# `CycleJSONPDriver` object API

- [`makeJSONPDriver`](#makeJSONPDriver)

### <a id="makeJSONPDriver"></a> `makeJSONPDriver()`

JSONP Driver factory.

This is a function which, when called, returns a JSONP Driver for Cycle.js
apps. The driver is also a function, and it takes an Observable of requests
(URL strings) as input, and generates a metastream of responses.

**Requests**. The Observable of requests should strings as the URL of the
remote resource over HTTP.

**Responses**. A metastream is an Observable of Observables. The response
metastream emits Observables of responses. These Observables of responses
have a `request` field attached to them (to the Observable object itself)
indicating which request (from the driver input) generated this response
Observable. The response Observables themselves emit the response object
received through the npm `jsonp` package.

#### Return:

*(Function)* the JSONP Driver function
