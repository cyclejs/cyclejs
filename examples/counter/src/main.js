import xs from 'xstream';
import Cycle from '@cycle/xstream-run';
import {div, button, p, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  let action$ = xs.merge(
    sources.DOM.select('.decrement').events('click').map(ev => -1),
    sources.DOM.select('.increment').events('click').map(ev => +1)
  );
  let count$ = action$.fold((x,y) => x + y, 0);
  return {
    DOM: count$.map(count =>
        div([
          button('.decrement', 'Decrement'),
          button('.increment', 'Increment'),
          p('Counter: ' + count)
        ])
      )
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
