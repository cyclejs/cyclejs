/** @jsx hJSX */
import {run, Rx} from '@cycle/core';
import {makeDOMDriver, hJSX} from '@cycle/dom';

function main(drivers) {
  let secondsElapsed$ = Rx.Observable.interval(1000)
    .map(i => i + 1)
    .startWith(0);
  let vtree$ = secondsElapsed$.map(secondsElapsed =>
    <div>Seconds elapsed {secondsElapsed}</div>
  );
  return {DOM: vtree$};
}

let drivers = {
 DOM: makeDOMDriver('#main-container')
};

run(main, drivers);
