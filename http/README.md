# Cycle HTTP

A Driver for making HTTP requests, based on [superagent](https://github.com/visionmedia/superagent).

```
npm install @cycle/http
```

## Usage

Basics:

```js
import xs from 'xstream';
import {run} from '@cycle/xstream-run';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {
  // ...
}

const drivers = {
  HTTP: makeHTTPDriver()
}

run(main, drivers);
```

Simple and normal use case:

```js
function main(sources) {
  let request$ = xs.of({
    url: 'http://localhost:8080/hello', // GET method by default
    category: 'hello',
  });

  let response$ = sources.HTTP
    .select('hello')
    .flatten();

  let vdom$ = response$
    .map(res => res.text) // We expect this to be "Hello World"
    .startWith('Loading...')
    .map(text =>
      div('.container', [
        h1(text)
      ])
    );

  return {
    DOM: vtree$,
    HTTP: request$
  };
}
```

A thorough guide to the API inside `main`:

```js
function main(source) {
  // The HTTP Source has properties:
  // - select(category) or select()
  // - filter(predicate)
  // Notice $$: it means this is a metastream, in other words,
  // a stream of streams.
  let httpResponse$$ = source.HTTP.select();

  httpResponse$$.addListener({
    next: httpResponse$ => {
      // Notice that httpResponse$$ emits httpResponse$.

      // The response stream has a special field attached to it:
      // `request`, which is the same object we emit in the sink stream.
      // This is useful for filtering: you can find the
      // httpResponse$ corresponding to a certain request.
      console.log(httpResponse$.request);
    },
    error: () => {},
    complete: () => {},
  });

  let httpResponse$ = httpResponse$$.flatten(); // flattens the metastream
  // the reason why we need to flatten in this API is that you
  // should choose which concurrency strategy to use.
  // Normal xstream flatten() has limited concurrency of 1, meaning that
  // the previous request will be canceled once the next request to the
  // same resource occurs.
  // To have full concurrency (no cancelling), use flattenConcurrently()

  httpResponse$.addListener({
    next: httpResponse => {
      // httpResponse is the object we get as response from superagent.
      // Check the documentation in superagent to know the structure of
      // this object.
      console.log(httpResponse.status); // 200
    },
    error: (err) => {
      // This is a network error
      console.error(err);
    },
    complete: () => {},
  });

  // The request stream is an object with property `url` and value
  // `http://localhost:8080/ping` emitted periodically, every second.
  let request$ = xs.periodic(1000)
    .mapTo({ url: 'http://localhost:8080/ping', method: 'GET' });

  return {
    HTTP: request$ // HTTP driver expects the request$ as input
  };
}
```

## Error handling

You can handle errors using standard xstream or RxJS operators. The response stream is a stream of streams, i.e. each response will be its own stream so usually you want to catch errors for that single response stream:

```js
sources.HTTP
  .select('hello')
  .map((response$) =>
    response$.replaceError(() => xs.of(errorObject))
  ).flatten()
```
For more information, refer to the [xstream documentation for replaceError](https://github.com/staltz/xstream#replaceError) or the [RxJS documention for catch](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/catch.md).

## More information

For a more advanced usage, check the [Search example](https://github.com/cyclejs/cyclejs/tree/master/examples/http-search-github).

## Browser support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-http.svg)](https://saucelabs.com/u/cyclejs-http)

IE 8 is not supported because this library depends on [superagent](https://github.com/visionmedia/superagent), which knowingly doesn't support IE 8.

# API

- [`makeHTTPDriver`](#makeHTTPDriver)

### <a id="makeHTTPDriver"></a> `makeHTTPDriver()`

HTTP Driver factory.

This is a function which, when called, returns a HTTP Driver for Cycle.js
apps. The driver is also a function, and it takes a stream of requests as
input, and outputs an HTTP Source, an object with some functions to query for
response streams.

**Requests**. The stream of requests should emit either strings or objects.
If the stream emits strings, those should be the URL of the remote resource
over HTTP. If the stream emits objects, these should be instructions how
superagent should execute the request. These objects follow a structure
similar to superagent's request API itself. `request` object properties:

- `url` *(String)*: the remote resource path. **required**
- `method` *(String)*: HTTP Method for the request (GET, POST, PUT, etc).
- `category` *(String)*: an optional and arbitrary key that may be used in
the HTTP Source when querying for the response. E.g.
`sources.http.select(category)`
- `query` *(Object)*: an object with the payload for `GET` or `POST`.
- `send` *(Object)*: an object with the payload for `POST`.
- `headers` *(Object)*: object specifying HTTP headers.
- `accept` *(String)*: the Accept header.
- `type` *(String)*: a short-hand for setting Content-Type.
- `user` *(String)*: username for authentication.
- `password` *(String)*: password for authentication.
- `field` *(Object)*: object where key/values are Form fields.
- `progress` *(Boolean)*: whether or not to detect and emit progress events
on the response Observable.
- `attach` *(Array)*: array of objects, where each object specifies `name`,
`path`, and `filename` of a resource to upload.
- `withCredentials` *(Boolean)*: enables the ability to send cookies from the
origin.
- `redirects` *(Number)*: number of redirects to follow.
- `lazy` *(Boolean)*: whether or not this request runs lazily, which means
the request happens if and only if its corresponding response stream from the
HTTP Source is subscribed to. By default this value is false: requests run
eagerly, even if their response is ignored by the application.

**Responses**. A metastream is a stream that emits streams. The HTTP Source
manages response metastreams. These streams of responses have a `request`
field attached to them (to the stream object itself) indicating which request
(from the driver input) generated this response streams. The HTTP Source has
functions `filter()` and `select()`, but is not itself a stream. So you can
call `sources.HTTP.filter(request => request.url === X)` to get a new HTTP
Source object which is filtered for response streams that match the condition
given, and may call `sources.HTTP.select(category)` to get a metastream of
response that match the category key. With an HTTP Source, you can also call
`httpSource.select()` with no param to get the metastream. You should flatten
the metastream before consuming it, then the resulting response stream will
emit the response object received through superagent.

#### Return:

*(Function)* the HTTP Driver function

- - -

