'use strict';
let Cycle = require('@cycle/core');
let CycleWeb = require('../../lib/cycle-web');
let {app} = require('./app');

Cycle.run(app, {
  DOM: CycleWeb.makeDOMDriver('.app-container'),
  context: () => Cycle.Rx.Observable.just(window.appContext)
});
