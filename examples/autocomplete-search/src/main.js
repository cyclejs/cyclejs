import {Observable} from 'rxjs'
import Cycle from '@cycle/rxjs-run'
import {makeDOMDriver} from '@cycle/dom'
import {makeJSONPDriver} from '@cycle/jsonp'
import {restart, restartable} from 'cycle-restart'
let app = require('./app').default;

function preventDefaultSinkDriver(prevented$) {
  prevented$.subscribe(ev => {
    ev.preventDefault()
    if (ev.type === 'blur') {
      ev.target.focus()
    }
  })
  return Observable.empty()
}

const drivers = {
  DOM: makeDOMDriver('#main-container'),
  JSONP: makeJSONPDriver(),
  preventDefault: preventDefaultSinkDriver,
  // TODO: support cycle-restart in Cycle Diversity
  // DOM: restartable(makeDOMDriver('#main-container'), {pauseSinksWhileReplaying: false}),
  // JSONP: restartable(makeJSONPDriver()),
  // preventDefault: restartable(preventDefaultSinkDriver),
}

const {sinks, sources} = Cycle.run(app, drivers)

if (module && module.hot) {
  module.hot.accept('./app', () => {
    app = require('./app').default;
    restart(app, drivers, {sinks, sources});
  });
}
