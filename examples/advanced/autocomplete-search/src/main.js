import xs from 'xstream'
import {run} from '@cycle/run'
import {makeDOMDriver} from '@cycle/dom'
import {makeJSONPDriver} from '@cycle/jsonp'
import {timeDriver} from '@cycle/time'
import app from './app'

function preventDefaultSinkDriver(prevented$) {
  prevented$.addListener({
    next: ev => {
      ev.preventDefault()
      if (ev.type === 'blur') {
        ev.target.focus()
      }
    },
    error: () => {},
    complete: () => {},
  })
  return xs.empty()
}


run(app, {
  DOM: makeDOMDriver('#main-container'),
  JSONP: makeJSONPDriver(),
  preventDefault: preventDefaultSinkDriver,
  Time: timeDriver
});
