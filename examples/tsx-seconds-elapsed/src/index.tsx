const {html} = require('snabbdom-jsx');
import xs from 'xstream';
import Cycle from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';

interface Sources {
  DOM: Function
}

function main(sources : Sources) {
  return {
    DOM: xs.periodic(1000).map(i => i + 1).startWith(0)
      .map(i => <div>Seconds elapsed {i}</div>)
  };
}

const drivers : {[name : string] : Function} = {
  DOM: makeDOMDriver('#main-container')
};

Cycle.run(main, drivers);
