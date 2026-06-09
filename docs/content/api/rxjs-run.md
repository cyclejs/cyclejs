# Run() for RxJS - [source](https://github.com/cyclejs/cyclejs/tree/master/rxjs-run)

Cycle.js `run(main, drivers)` function for applications written with RxJS version **5**.

```
npm install @cycle/rxjs-run rxjs
```

**Note: `rxjs` package is required too.**

## Basic usage

```js
import run from '@cycle/rxjs-run';
import {button} from '@cycle/dom';

function main(sources) {
  const action$ = sources.DOM.select('button').events('click');
  const count$ = action$.scan(count => count + 1, 0).startWith(0);

  return {
    DOM: count$.map(count => button(String(count))),
  };
}

const dispose = run(main, drivers);
```

`run()` immediately starts the application and returns a dispose function. Call
that function when the application should stop listening to sources, stop
replicating sinks to drivers, and release driver resources.

```js
const dispose = run(main, drivers);

// Later:
dispose();
```

## Main and drivers

`main` receives driver sources as RxJS observables and returns sinks as RxJS
observables:

```js
function main(sources) {
  return {
    DOM: vdom$,
    HTTP: request$,
  };
}
```

`drivers` is still an object where each key matches a sink and source channel:

```js
const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
};
```

Internally, `@cycle/rxjs-run` delegates to `@cycle/run` and adapts between
xstream streams used by drivers and RxJS observables used by the application.

## setup()

Use `setup()` when you need access to `sources` and `sinks` before starting the
program. This is useful in tests, integration code, or custom bootstrapping.

```js
import {setup} from '@cycle/rxjs-run';

const {sources, sinks, run} = setup(main, drivers);

// Inspect sources or sinks here before the program starts.

const dispose = run();
```

Unlike `run(main, drivers)`, `setup(main, drivers)` does not start execution
until you call the returned `run()` function.

## RxJS expectations

Use `@cycle/rxjs-run` when your `main` function is written with RxJS streams.
Driver packages such as `@cycle/dom` and `@cycle/http` can still be the same
official drivers; this package handles the stream adaptation at the app
boundary.

# API
