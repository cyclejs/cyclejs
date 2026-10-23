# Cycle HTTP - [source](https://github.com/cyclejs/cyclejs/tree/master/http)

A Driver for making HTTP requests, based on [superagent](https://github.com/visionmedia/superagent).

```
npm install @cycle/http
```

## Usage

Basics:

```js
import xs from 'xstream';
import {run} from '@cycle/run';
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
    DOM: vdom$,
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

### Why a failed request feels like everything stopped

Errors in streams [are terminal](https://cycle.js.org/streams.html): a stream that emits an error is finished, and everything downstream of it stops too. When a request fails, its `response$` emits that error, and if you flattened the metastream without catching it, the error reaches the flattened stream in `main()` and kills it.

The HTTP Driver itself is not affected: it creates a fresh `response$` for every request it receives, so it keeps sending later requests. It is the flattened stream in `main()` that dies, which is why the app appears to have "stopped sending requests" after the first failure.

The fix is to catch each error on the *inner* stream, before flattening, so one failed response does not poison the rest of the flow:

```js
sources.HTTP
  .select('poll')
  .map((response$) =>
    response$.replaceError(() => xs.of(errorObject))
  )
  .flatten()
```

### What an error looks like

- When the server answered, the error is a [superagent error](https://github.com/visionmedia/superagent/blob/master/docs/index.md#handling-errors) and has `err.response` (the same response object as a successful call), so you can read `err.response.status`, `err.response.body`, and `err.response.request`.
- When the request could not be completed at all (DNS failure, connection refused, the URL is invalid), there is no `err.response`, only `err.message`.

## Example: a poller that survives failures

This example polls an invalid URL every two seconds. Every single response fails, yet the application keeps running and the page keeps updating, because each failed `response$` is recovered before flattening. Fix the URL string and the display switches to successful responses without any other change.

```js
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeHTTPDriver} from '@cycle/http';
import {div, h4, li, makeDOMDriver, ul} from '@cycle/dom';

function main(sources) {
  const request$ = xs.periodic(2000).mapTo({
    url: 'http://invalid.example/ping', // will fail
    method: 'GET',
    category: 'poll',
  });

  const response$ = sources.HTTP
    .select('poll')
    .map((response$) =>         // `response$` is one request's response stream
      response$
        .map((res) => ({type: 'ok', status: res.status, body: res.text}))
        .replaceError((err) =>  // recover instead of dying
          xs.of({type: 'error', message: err.message})
        )
    )
    .flatten();

  const state$ = response$
    .fold((list, out) => list.slice(-4).concat(out), []);

  const vdom$ = state$.map((items) =>
    div({}, [
      h4({}, ['Latest polls (newest first)']),
      ul({}, items.slice().reverse().map((out) =>
        li({}, [
          out.type === 'ok'
            ? `response ${out.status}: ${out.body}`
            : `failed: ${out.message}`,
        ])
      )),
    ])
  );

  return {
    DOM: vdom$,
    HTTP: request$,
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
});
```

Without the `replaceError` recovery, the first failure would kill `response$` and `vdom$`, and from then on the page would show nothing new while the driver kept polling.

### Deciding what to do per error

`replaceError` receives the error, so recovery can differ per case. In [xstream](https://github.com/staltz/xstream#replaceError) return the stream that should continue; in [RxJS](https://github.com/Reactive-Extensions/RxJS/blob/master/doc/api/core/operators/catch.md) the equivalent is `catch`, and `retry`/`retryWhen` also exist to repeat the whole chain:

```js
sources.HTTP
  .select('data')
  .map((response$) =>
    response$.replaceError((err) => {
      if (err.response && err.response.status === 401) {
        // Session is gone: emit something your app maps to a redirect,
        // e.g. drive the History sink to /login.
        return xs.of({kind: 'unauthorized'});
      }
      if (err.response) {
        // HTTP error the app can proceed without: keep the flow alive
        // with a fallback value instead of an error.
        return xs.of({kind: 'http-error', status: err.response.status});
      }
      // No server response at all (network failure): inform the user.
      return xs.of({kind: 'network-error', message: err.message});
    })
  )
  .flatten()
```

And the same shape in RxJS, where the metastream becomes a single stream with [`flatMap`](https://reactivex.io/documentation/operators/flatmap.html):

```js
import {Observable} from 'rxjs';

sources.HTTP
  .select('data')
  .flatMap((response$) =>
    response$.catch((err) =>
      Observable.of({kind: 'error', err})
    )
  )
```

## More information

For a more advanced usage, check the [Search example](https://github.com/cyclejs/cyclejs/tree/master/examples/http-search-github).

## Browser support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-http.svg)](https://saucelabs.com/u/cyclejs-http)

IE 8 is not supported because this library depends on [superagent](https://github.com/visionmedia/superagent), which knowingly doesn't support IE 8.

# Isolation semantics

Cycle HTTP supports isolation between components using the `@cycle/isolate` package. Here is how isolation contexts work in Cycle HTTP given a `scope` to `isolate(Component, scope)`:

**When the scope is `null`: no isolation.**

The child component will have run in the same context as its parent, and methods like `HTTPSource.select()` will have access to response streams related to the parent. This means the child component is able to see responses that it did not itself produce.

**When the scope is a string: siblings isolation.**

A `HTTPSource.select()` call in a parent component will have access to HTTP responses from its children. However, a `HTTPSource.select()` inside a child component isolated with "siblings isolation" will have no access to HTTP responses in other children components isolated with "siblings isolation".

# API
