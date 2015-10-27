
# historyDriver(url$: Rx.Observable): Rx.Observable<Loction>

This is the function which your Cycle application's `main()` interacts with.

It expects `url$` to be an Rx.Observable.
The values produced by url$ can be either in the form of a string or an Object.

```js
// as a string
const url$ = Rx.Observable.of('/home/profile')

// as an Object

const url$ = Rx.Observable.of({
  url: '/home/profile', // required
  state: { the: 'state' }, // optional
  query: { the: 'query' } // optional if QuerySupport is enabled
})
```

In return you will be given an Rx.Observable with the current [Location](https://github.com/rackt/history/blob/master/docs/Location.md). With some extra functions appended.The functions appended to the returned Observable can be found [here](https://github.com/rackt/history/blob/master/docs/Glossary.md#history). All of those functions are exposed except for `listen()`.

# Basic Example
```js
import { run } from '@cycle/core'
import { makeDOMDriver, h } from '@cycle/dom'
import { makeHistoryDriver, filterLinks } from '@cycle/history'

function main({ DOM, History }){

  const url$ = DOM
    .select('a')
    .events('click')
    .filter(filterLinks)
    .map(event => event.target.pathname)

  const view$ = History
    .startWith({
      pathname: '/',
    })
    .map(location => {
      switch (location.pathname) {
        case '/home':
          return renderHome()
        default:
          return renderIndex()
      }
    })

  return {
    History: url$,
    DOM: view$,
  }
}

run(main, {
  DOM: makeDOMDriver('.app-container'),
  History: makeHistoryDriver(),
})


```
