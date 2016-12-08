import {makeTimeDriver} from '../src/time-driver';
import {makeDOMDriver, div, button} from '@cycle/dom';
import {run} from '@cycle/xstream-run';
import xs from 'xstream';

const drivers = {
  DOM: makeDOMDriver('.app'),
  Time: makeTimeDriver()
}

function main ({DOM, Time}) {
  const add$ = DOM
    .select('.add')
    .events('click')
    .mapTo(+1)
    .compose(Time.delay(1000));

  const count$ = add$.fold((total, change) => total + change, 0);

  return {
    DOM: count$.map(count =>
      div([
        `Count: ${count}`,
        button('.add', 'Add')
      ])
    )
  }
}

run(main, drivers);
