let Cycle = require('@cycle/core');
let {Observable} = require('rx');
let {makeDOMDriver} = require('@cycle/dom');
let app = require('./app');

function clientSideApp(responses) {
  let requests = app(responses);
  requests.DOM = requests.DOM.skip(1);
  return requests;
}

Cycle.run(clientSideApp, {
  DOM: makeDOMDriver('.app-container'),
  context: () => Observable.just(window.appContext)
});
