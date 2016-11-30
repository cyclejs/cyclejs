import makeTimeDriver from '../src/time-driver';
import {makeDOMDriver, div} from '@cycle/dom';
import {run} from '@cycle/xstream-run';
import xs from 'xstream';

const drivers = {
  DOM: makeDOMDriver('.app'),
  Time: makeTimeDriver()
}

function main ({DOM, Time}) {
  const count$ = Time.interval(500);

  Time.runRealtime();

  return {
    DOM: count$.map(count => div(`Count: ${count}`))
  }
}

run(main, drivers);
