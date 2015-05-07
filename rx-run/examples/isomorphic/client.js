'use strict';
let Cycle = require('../../lib/cycle');
let {makeComputerFn} = require('./app');

let context$ = Cycle.Rx.Observable.just(window.appContext);
Cycle.applyToDOM('.app-container', makeComputerFn(context$));
