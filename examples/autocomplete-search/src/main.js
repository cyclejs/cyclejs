import {Observable} from 'rx'
import Cycle from '@cycle/core'
import {makeDOMDriver} from '@cycle/dom'
import {makeJSONPDriver} from '@cycle/jsonp'
import {restart, restartable} from 'cycle-restart'
let app = require('./app')

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
  DOM: restartable(makeDOMDriver('#main-container'), {pauseSinksWhileReplaying: false}),
  JSONP: restartable(makeJSONPDriver()),
  preventDefault: restartable(preventDefaultSinkDriver),
}

Cycle.run(app, drivers)

if (module && module.hot) {
  module.hot.accept('./app', () => {
    app = require('./app').default;
    restart(app, drivers, {sinks, sources}, isolate);
  });
}
