import xs from 'xstream';
import Cycle from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';
import {html} from 'snabbdom-jsx';

function main(sources) {
  return {
    DOM: xs.periodic(1000).map(i => i + 1).startWith(0)
      .map(i => <div>Seconds elapsed {i}</div>)
  };
}

const drivers = {
  DOM: makeDOMDriver('#main-container')
};

Cycle.run(main, drivers);
