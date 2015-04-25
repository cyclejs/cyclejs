'use strict';
let Cycle = require('../../lib/cycle');
let {computer, human} = require('./app');

let context$ = Cycle.Rx.Observable.just(window.appContext);
let vtree$ = Cycle.createStream(computer);
let interaction$ = Cycle.createStream(human);

interaction$.inject(vtree$).inject(context$, interaction$);
