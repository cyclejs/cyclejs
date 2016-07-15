import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';
import List from './List';

function main(sources) {
  return List(sources);
}

run(main, {
  DOM: makeDOMDriver('#main-container')
});
