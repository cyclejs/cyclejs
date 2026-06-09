# Run() for most.js - [source](https://github.com/cyclejs/cyclejs/tree/master/most-run)

Cycle.js `run(main, drivers)` function for applications written with most.js
(Monadic Streams).

```
npm install @cycle/most-run most
```

**Note: `most` package is required too.**

## Basic usage

```js
import run from '@cycle/most-run';
import {button} from '@cycle/dom';

function main(sources) {
  const action$ = sources.DOM.select('button').events('click');
  const count$ = action$.scan((count, _event) => count + 1, 0).startWith(0);

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

`main` receives driver sources as most.js streams and returns sinks as most.js
streams:

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

Internally, `@cycle/most-run` delegates to `@cycle/run` and adapts between
xstream streams used by drivers and most.js streams used by the application.

## setup()

Use `setup()` when you need access to `sources` and `sinks` before starting the
program. This is useful in tests, integration code, or custom bootstrapping.

```js
import {setup} from '@cycle/most-run';

const {sources, sinks, run} = setup(main, drivers);

// Inspect sources or sinks here before the program starts.

const dispose = run();
```

Unlike `run(main, drivers)`, `setup(main, drivers)` does not start execution
until you call the returned `run()` function.

## Testing usage

`setup()` also lets tests subscribe to sources or sinks before starting the
program:

```js
import {setup} from '@cycle/most-run';

const {sources, run} = setup(main, drivers);

const observed = sources.DOM.select(':root').elements
  .observe(element => {
    // assert against the rendered root element
  });

const dispose = run();

observed.then(() => dispose());
```

## most.js expectations

Use `@cycle/most-run` when your `main` function is written with most.js streams.
Driver packages such as `@cycle/dom` and `@cycle/http` can still be the same
official drivers; this package handles the stream adaptation at the app
boundary.

# API
