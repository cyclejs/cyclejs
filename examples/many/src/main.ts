import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import onionify from 'cycle-onionify';
import List from './List';

const main = onionify(List);

run(main, {
  DOM: makeDOMDriver('#main-container'),
});
