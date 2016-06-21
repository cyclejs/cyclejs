
# Cycle JSONP Driver

- [`makeJSONPDriver`](#makeJSONPDriver)

### <a id="makeJSONPDriver"></a> `makeJSONPDriver()`

JSONP Driver factory.

This is a function which, when called, returns a JSONP Driver for Cycle.js
apps. The driver is also a function, and it takes a stream of requests
(URL strings) as input, and generates a metastream of responses.

**Requests**. The stream of requests should emit strings as the URL of the
remote resource over HTTP.

**Responses**. A metastream is a stream of streams. The response metastream
emits streams of responses. These streams of responses have a `request`
field attached to them (to the stream object itself) indicating which
request (from the driver input) generated this response stream. The
response streams themselves emit the response object received through the
npm `jsonp` package.

#### Return:

*(Function)* the JSONP Driver function

- - -

