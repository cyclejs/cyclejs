import {run} from '@cycle/run';
import {Stream as xs} from 'xstream';
import fromEventModule from 'xstream/extra/fromEvent.js';
import {makeDOMDriver} from '@cycle/dom';
import app from './app.js';

const appContext = JSON.parse(
  document.querySelector('.app-container').getAttribute('data-app-context')
);
const fromEvent = fromEventModule.default || fromEventModule;

function clientSideApp(sources) {
  const sinks = app(sources);
  sinks.DOM = sinks.DOM.drop(1);
  return sinks;
}

function preventDefaultDriver(ev$) {
  ev$.addListener({
    next: ev => ev.preventDefault(),
  });
}

run(clientSideApp, {
  DOM: makeDOMDriver('.app-container'),
  context: () =>
    xs.merge(
      xs.of(appContext),
      fromEvent(window, 'popstate').map(() => ({
        route: window.location.pathname,
      }))
    ),
  PreventDefault: preventDefaultDriver,
});
