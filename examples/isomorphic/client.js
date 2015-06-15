'use strict';
let Cycle = require('../../lib/core/cycle');
let {app} = require('./app');

Cycle.run(app, {
  DOM: Cycle.makeDOMDriver('.app-container'),
  context: () => Cycle.Rx.Observable.just(window.appContext)
});
