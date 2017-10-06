import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '../../../../lib/cjs/index';
import App from './app.js';

const main = App;

run(main, {
  DOM: makeDOMDriver('#main-container', {transposition: true})
});
