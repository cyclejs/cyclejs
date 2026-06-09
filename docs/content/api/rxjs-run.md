# Run() for RxJS - [source](https://github.com/cyclejs/cyclejs/tree/master/rxjs-run)

Cycle.js `run(main, drivers)` function for applications written with RxJS version **5**.

```
npm install @cycle/rxjs-run rxjs
```

**Note: `rxjs` package is required too.**

## Basic usage

```js
import run from '@cycle/rxjs-run'

run(main, drivers)
```

## Testing usage

Use `setup()` when a test needs access to the application sources or sinks
before the circular connection starts. This returns `{sources, sinks, run}`.
The application only begins after `run()` is called, and `run()` returns the
dispose function.

```js
import {setup} from '@cycle/rxjs-run'

const {sources, sinks, run} = setup(main, drivers)

let dispose

sources.DOM.select(':root').elements()
  .subscribe({
    next: element => {
      fn(element)
      dispose()
    },
  })

dispose = run() // start the loop
```

# API
