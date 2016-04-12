import {Observable} from 'rxjs';
import Cycle from '@cycle/rxjs-run';
import {div, button, p, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  let action$ = Observable.merge(
    sources.DOM.select('.decrement').events('click').map(ev => -1),
    sources.DOM.select('.increment').events('click').map(ev => +1)
  );
  let count$ = action$.startWith(0).scan((x,y) => x+y);
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
