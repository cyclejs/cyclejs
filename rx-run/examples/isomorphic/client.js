'use strict';
let Cycle = require('../../lib/core/cycle');
let {app} = require('./app');

function contextAdapter() {
  return {
    get: () => Cycle.Rx.Observable.just(window.appContext)
  };
}

Cycle.run(app, {
  dom: Cycle.makeDOMAdapter('.app-container'),
  context: contextAdapter
});
