import xs, {Stream} from 'xstream'
import {run} from '@cycle/run'
import {makeDOMDriver} from '@cycle/dom'
import {makeJSONPDriver} from '@cycle/jsonp'
import {timeDriver} from '@cycle/time'
import app from './app'
import { withState } from '@cycle/state';

function preventDefaultSinkDriver(prevented$: Stream<Event>) {
  prevented$.addListener({
    next: (ev) => {
      ev.preventDefault()
      if (ev.type === 'blur') {
        (ev.target as HTMLElement).focus()
      }
    },
    error: () => {},
    complete: () => {},
  })
  return xs.empty()
}

const wrappedMain = withState(app);
run(wrappedMain, {
  DOM: makeDOMDriver('#main-container'),
  JSONP: makeJSONPDriver(),
  preventDefault: preventDefaultSinkDriver,
  Time: timeDriver
});
