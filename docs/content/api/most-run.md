# Run() for @most/core - [source](https://github.com/cyclejs/cyclejs/tree/master/most-run)

Cycle.js `run(main, drivers)` function for applications written with the
functional, tree-shakeable `@most/core` API.

```
npm install @cycle/most-run @most/core @most/scheduler
```

**Note: `@most/core` is required too.** Operators such as `map`, `take`, and
`tap` are standalone functions rather than methods on streams.

## Basic usage

```js
import run from '@cycle/most-run'
import {map} from '@most/core'

function main(sources) {
  return {
    DOM: map(render, sources.state)
  }
}

run(main, drivers)
```

## Testing usage

```js
import {runEffects, tap} from '@most/core'
import {newDefaultScheduler} from '@most/scheduler'
import {setup} from '@cycle/most-run'

const {sources, sinks, run} = setup(main, drivers)
const scheduler = newDefaultScheduler()

let dispose

runEffects(
  tap(fn, sources.DOM.select(':root').elements),
  scheduler
).then(() => dispose())

dispose = run() // start the loop
```

# API
