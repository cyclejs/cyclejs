import {run} from '@cycle/core';
import {makeDOMDriver} from '@cycle/dom';
import app from './app.js';

function main(responses) {
  return {
    DOM: app.view(app.model(app.intent(responses.DOM)))
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container')
});
