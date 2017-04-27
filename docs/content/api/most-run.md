# Run() for most.js

Cycle.js `run(main, drivers)` function for applications written with most.js (Monadic Streams)

```
npm install @cycle/most-run most
```

**Note: `most` package is required too.**

## Basic usage

```js
import run from '@cycle/most-run'

run(main, drivers)
```

## Testing usage

```js
import {setup} from '@cycle/most-run'

const {sources, sinks, run} = setup(main, drivers)

let dispose

sources.DOM.select(':root').elements
  .observe(fn)
  .then(() => dispose())

dispose = run() // start the loop
```

# API