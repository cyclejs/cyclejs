# Cycle HTTP Driver

A [Cycle.js](http://cycle.js.org) [Driver](http://cycle.js.org/drivers.html) for making HTTP requests, based on [superagent](https://github.com/visionmedia/superagent).

```
npm install @cycle/http
```

[![npm version](https://badge.fury.io/js/%40cycle%2Fhttp.svg)](http://badge.fury.io/js/%40cycle%2Fhttp)

## Why are Issues unavailable?

We use only one repository for issues. [**Open the issue at Cycle Core repo.**](https://github.com/cyclejs/core/issues)

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
  // - select(category)
  // - filter(predicate)
  // - response$$
  // Notice $$: it means this is a metastream, in other words,
  // a stream of streams.
  let httpResponse$$ = source.HTTP.response$$;

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
    response$.replaceError(xs.of(errorObject))
  ).flatten()
```
For more information, refer to the [xstream documentation for replaceError](https://github.com/staltz/xstream#replaceError) or the [RxJS documention for catch](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/catch.md).

## More information

For a more advanced usage, check the [Search example](https://github.com/cyclejs/examples/tree/master/http-search-github) and the [documentation](https://github.com/cyclejs/http/blob/master/docs/api.md).

## Browser support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-http.svg)](https://saucelabs.com/u/cyclejs-http)

IE 8 is not supported because this library depends on [superagent](https://github.com/visionmedia/superagent), which knowingly doesn't support IE 8.

- - -

[![Build Status](https://travis-ci.org/cyclejs/http.svg?branch=master)](https://travis-ci.org/cyclejs/http)
[![Dependency Status](https://david-dm.org/cyclejs/http.svg)](https://david-dm.org/cyclejs/http)
[![devDependency Status](https://david-dm.org/cyclejs/http/dev-status.svg)](https://david-dm.org/cyclejs/http#info=devDependencies)
