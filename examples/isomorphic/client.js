let Cycle = require('@cycle/rx-run');
let {Observable} = require('rx');
let {makeDOMDriver} = require('@cycle/dom');
let app = require('./app');

function clientSideApp(sources) {
  let sinks = app(sources);
  sinks.DOM = sinks.DOM.skip(1);
  return sinks;
}

Cycle.run(clientSideApp, {
  DOM: makeDOMDriver('.app-container'),
  context: () => Observable.of(window.appContext)
});
