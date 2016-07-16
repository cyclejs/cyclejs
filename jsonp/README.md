# Cycle JSONP

A Driver for making HTTP requests through the JSONP hack, based on the [jsonp](https://github.com/webmodules/jsonp) package. This package is small, hacky (as JSONP is too), and untested. Whenever possible, use proper server and client CORS solution with the HTTP Driver.

```
npm install @cycle/jsonp
```

## Usage

```js
function main(responses) {
  // This API endpoint returns a JSON response
  const HELLO_URL = 'http://localhost:8080/hello';
  let request$ = Rx.Observable.just(HELLO_URL);
  let vtree$ = responses.JSONP
    .filter(res$ => res$.request === HELLO_URL)
    .mergeAll()
    .startWith({text: 'Loading...'})
    .map(json =>
      h('div.container', [
        h('h1', json.text)
      ])
    );

  return {
    DOM: vtree$,
    JSONP: request$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('.js-container'),
  JSONP: makeJSONPDriver()
})
```

# API

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

