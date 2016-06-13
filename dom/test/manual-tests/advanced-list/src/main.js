import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '../../../../lib/index';
import App from './App.js';

const main = App;

run(main, {
  DOM: makeDOMDriver('#main-container', {transposition: true})
});
