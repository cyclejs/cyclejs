import {run} from '@cycle/core';
import {makeDOMDriver} from '@cycle/dom';
import app from './app.js';

const main = app;

run(main, {
  DOM: makeDOMDriver('#main-container')
});
