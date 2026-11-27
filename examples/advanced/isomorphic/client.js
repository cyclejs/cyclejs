import {run} from '@cycle/run';
import {Stream as xs} from 'xstream';
import {makeDOMDriver} from '@cycle/dom';
import app from './app.js';

function preventDefaultDriver(ev$) {
  ev$.addListener({
    next: ev => ev.preventDefault(),
  });
}

run(app, {
  DOM: makeDOMDriver('.app-container'),
  context: () => xs.of(window.appContext),
  PreventDefault: preventDefaultDriver,
});
