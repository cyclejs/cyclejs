import {run} from '@cycle/core';
import {makeDOMDriver} from '@cycle/dom';
import list from './list';

function main(sources) {
  return list(sources, ['.many-list']);
}

run(main, {
  DOM: makeDOMDriver('#main-container')
});
