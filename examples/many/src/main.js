import {run} from '@cycle/core';
import {makeDOMDriver} from '@cycle/dom';
import List from './List';

function main(sources) {
  return List(sources, ['.many-list']);
}

run(main, {
  DOM: makeDOMDriver('#main-container')
});
