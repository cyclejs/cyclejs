# Cycle-History

A [cycle.js](http://cycle.js.org) driver built on [history](https://github.com/rackt/history). A part of your overall routing solution.

To finish the routing cycle I highly recommend [switch-path](https://github.com/staltz/switch-path), or you can provide your own.

# Installation
`npm install cycle-history`


# Usage
### Client-Side
Define with your other drivers
```javascript
//import
import {makeHistory, filterLinks} from 'cycle-history';
import switchPath from 'switch-path';

// Defined with your drivers
History: makeHistoryDriver({
  hash: false, // default, true if your browser doesn't support History API
  queries: true // default, toggle QuerySupport
  basename: '' // default, sets up BasenameSupport
  // all other history Options
})

// Use in Main - shown in conjunction with switch-path
function main({DOM, History}) {
  const pathValue$ = History.map(location => { // History Location Object
      let {path, value} = switchPath(location.pathname, routes)
      return [path, value]
  });

  const url$ = DOM.select('a').events('click').filter(filterLinks)
  // filterLinks will make sure this is a path we want to handle
  // Best to provide more precise selectors to avoid this need.

  return {
    ...
    History: url$
  }

}
```
[Info on QuerySupport](https://github.com/rackt/history/blob/master/docs/QuerySupport.md)

[Info on BasenameSupport](https://github.com/rackt/history/blob/master/docs/BasenameSupport.md)

### Server-Side
Following @staltz [isomorphic example](https://github.com/cyclejs/cycle-examples/blob/master/isomorphic/server.js)
```javascript
// server.js
// Lines 27-37 become
function wrapAppResultWithBoilerplate(appFn, bundle$) {
  return function wrappedAppFn(ext) {
    let requests = appFn(ext);
    let wrappedVTree$ = Rx.Observable.combineLatest(requests.DOM, bundle$,
      wrapVTreeWithHTMLBoilerplate
    );
    return {
      DOM: wrappedVTree$,
      History: requests.History
    };
  };
}
// Lines 71-74 become
let [requests, responses] = Cycle.run(wrappedAppFn, {
  DOM: makeHTMLDriver(),
  History: makeServerHistoryDriver({
    pathname: req.url
  })
});
```
`makeServerHistoryDriver()` accepts all options allowed in a [Location](https://github.com/rackt/history/blob/master/docs/Location.md) as well as the extra options provided by BasenameSupport and QuerySupport, each respectively can be found   [here](https://github.com/rackt/history/blob/master/docs/BasenameSupport.md) and [here](https://github.com/rackt/history/blob/master/docs/QuerySupport.md). Simple defaults are provided if not supplied.

For more concrete examples on usage, please check out [cycle-starter](https://github.com/tylors/cycle-starter)

In @staltz isomorphic example, you can remove all references to context$ if it is now unneeded for your application.
