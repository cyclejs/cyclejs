'use strict';
let Cycle = require('@cycle/core');
let CycleWeb = require('../../lib/cycle-web');
let {app} = require('./app');

function clientSideApp(responses) {
  let requests = app(responses);
  requests.DOM = requests.DOM.skip(1);
  return requests;
}

Cycle.run(clientSideApp, {
  DOM: CycleWeb.makeDOMDriver('.app-container'),
  context: () => Cycle.Rx.Observable.just(window.appContext)
});
