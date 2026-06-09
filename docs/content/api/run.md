# Run() for xstream - [source](https://github.com/cyclejs/cyclejs/tree/master/run)

Cycle.js `run(main, drivers)` function for applications written with xstream.

```
npm install @cycle/run xstream
```

**Note: `xstream` package is required too.**

## Basic usage

```js
import {run} from '@cycle/run';
import {button} from '@cycle/dom';

function main(sources) {
  const action$ = sources.DOM.select('button').events('click');
  const count$ = action$.fold(count => count + 1, 0);

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

`main` is the pure part of a Cycle.js program. It receives sources from drivers
and returns sinks for those drivers:

```js
function main(sources) {
  return {
    DOM: vdom$,
    HTTP: request$,
  };
}
```

`drivers` is an object where each key matches a sink and source channel. Driver
functions receive a sink stream and return a source:

```js
const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
};
```

The `DOM` sink is consumed by the DOM driver and `sources.DOM` is returned to
`main`. The same pattern applies to every driver.

## setup()

Use `setup()` when you need access to `sources` and `sinks` before starting the
program. This is useful in tests, integration code, or custom bootstrapping.

```js
import {setup} from '@cycle/run';

const {sources, sinks, run} = setup(main, drivers);

// Inspect sources or sinks here before the program starts.

const dispose = run();
```

Unlike `run(main, drivers)`, `setup(main, drivers)` does not start execution
until you call the returned `run()` function.

## setupReusable()

Use `setupReusable()` when you want to create driver sources once and run
multiple sink collections through the same driver set.

```js
import {setupReusable} from '@cycle/run';

const engine = setupReusable(drivers);

const firstDispose = engine.run(firstMain(engine.sources));
firstDispose();

const secondDispose = engine.run(secondMain(engine.sources));
secondDispose();

engine.dispose();
```

Call `engine.dispose()` when you are done reusing those drivers.

## xstream expectations

`@cycle/run` expects sink streams to be xstream streams. If you use another
stream library for your application code, use `@cycle/rxjs-run` or
`@cycle/most-run` instead so that source and sink streams are adapted correctly.

# API
