let Cycle = require('@cycle/xstream-run');
let xs = require('xstream').default;
let {makeDOMDriver} = require('@cycle/dom');
let app = require('./app');

function clientSideApp(sources) {
  let sinks = app(sources);
  sinks.DOM = sinks.DOM.drop(1);
  return sinks;
}

function preventDefaultDriver(ev$) {
  ev$.addListener({
    next: ev => ev.preventDefault(),
    error: () => {},
    complete: () => {},
  });
}

Cycle.run(clientSideApp, {
  DOM: makeDOMDriver('.app-container'),
  context: () => xs.of(window.appContext),
  PreventDefault: preventDefaultDriver,
});
