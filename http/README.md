# Cycle HTTP Driver

A [Cycle.js](http://cycle.js.org) [Driver](http://cycle.js.org/drivers.html) for making HTTP requests, based on [superagent](https://github.com/visionmedia/superagent).

```
npm install @cycle/http
```

[![npm version](https://badge.fury.io/js/%40cycle%2Fhttp.svg)](http://badge.fury.io/js/%40cycle%2Fhttp)

## Usage

Basics:

```js
import Cycle from '@cycle/core';
import {makeHTTPDriver} from '@cycle/http';

function main(responses) {
  // ...
}

const drivers = {
  HTTP: makeHTTPDriver()
}

Cycle.run(main, drivers);
```

Simple and normal use case:

```js
function main(responses) {
  const HELLO_URL = 'http://localhost:8080/hello';
  let request$ = Rx.Observable.just(HELLO_URL);
  let vtree$ = responses.HTTP
    .filter(res$ => res$.request === HELLO_URL)
    .mergeAll()
    .map(res => res.text) // We expect this to be "Hello World"
    .startWith('Loading...')
    .map(text =>
      h('div.container', [
        h('h1', text)
      ])
    );

  return {
    DOM: vtree$,
    HTTP: request$
  };
}
```

A thorough guide to the Observable API inside `main`:

```js
function main(responses) {
  // Notice $$: it means this is a metastream, in other words, an Observable
  // of Observables.
  let httpResponse$$ = responses.HTTP;

  httpResponse$$.subscribe(httpResponse$ => {
    // Notice that httpResponse$$ emits httpResponse$.
    
    // The response Observable has a special field attached to it:
    // `request`, which is the same object we emit in the Observable at the
    // return of `main`. This is useful for filtering: you can find the 
    // httpResponse$ corresponding to a certain request.
    console.log(httpResponse$.request);
  });

  let httpResponse$ = httpResponse$$.mergeAll(); // flattens the metastream
  // OR `httpResponse$$.switch()` to ignore past response streams.
  
  httpResponse$.subscribe(httpResponse => {
    // httpResponse is the object we get as response from superagent.
    // Check the documentation in superagent to know the structure of
    // this object.
    console.log(httpResponse.status); // 200
  });

  // The request Observable is the string `http://localhost:8080/ping` emitted
  // every second.
  let request$ = Rx.Observable.interval(1000)
    .map(() => 'http://localhost:8080/ping');

  return {
    HTTP: request$ // HTTP driver expects the request$ as input
  };
}
```

For a more advanced usage, check the [Search example](https://github.com/cyclejs/cycle-http-driver/blob/master/examples/search/search.js) and the [documentation](https://github.com/cyclejs/cycle-http-driver/blob/master/docs/api.md).

## Browser support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-http.svg)](https://saucelabs.com/u/cyclejs-http)

IE 8 is not supported because this library depends on [superagent](https://github.com/visionmedia/superagent), which knowingly doesn't support IE 8.

- - -

[![Build Status](https://travis-ci.org/cyclejs/cycle-http-driver.svg?branch=master)](https://travis-ci.org/cyclejs/cycle-http-driver)
[![Dependency Status](https://david-dm.org/cyclejs/cycle-http-driver.svg)](https://david-dm.org/cyclejs/cycle-http-driver)
[![devDependency Status](https://david-dm.org/cyclejs/cycle-http-driver/dev-status.svg)](https://david-dm.org/cyclejs/cycle-http-driver#info=devDependencies)
