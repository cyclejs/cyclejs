# Run() for most.js

`Cycle.run()` function for applications written with most.js (Monadic Streams)

```
npm install @cycle/most-run most
```

**Note: `most` package is required too.**

## Basic usage

```js
import Cycle from '@cycle/most-run'

Cycle.run(main, drivers)
```

## Testing usage

```js
import Cycle from '@cycle/most-run'

const {sources, sinks, run} = Cycle(main, drivers)

let dispose

sources.DOM.select(':root').elements
  .observe(fn)
  .then(() => dispose())

dispose = run() // start the loop
```

# API