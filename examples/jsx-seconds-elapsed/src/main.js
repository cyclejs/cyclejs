import Cycle from '@cycle/rx-run';
import {Observable} from 'rx';
import {makeDOMDriver} from '@cycle/dom';
import {html} from 'snabbdom-jsx';

function main(drivers) {
  return {
    DOM: Observable.timer(0, 1000)
      .map(i => <div>Seconds elapsed {i}</div>)
  };
}

const drivers = {
 DOM: makeDOMDriver('#main-container')
};

Cycle.run(main, drivers);
