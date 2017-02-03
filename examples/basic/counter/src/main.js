// Counter: Basic Example

import xs from 'xstream';
import Cycle from '@cycle/xstream-run';
import {div, button, p, makeDOMDriver} from '@cycle/dom';

function main(sources) {

  // concurrent merge of both streams into single one
  let action$ = xs.merge(

    // map decrement click events into Stream of '-1'
    sources.DOM.select('.decrement')
      .events('click')
      .map(ev => -1),

    // map increment click events into Stream of '1'
    sources.DOM.select('.increment')
      .events('click')
      .map(ev => +1)

  );

  // Add all stream values throughout entire stream
  // https://github.com/staltz/xstream#fold 
  let count$ = action$.fold((acc, seed) => acc + seed, 0);

  return {
    DOM: count$.map(count =>

        div([
          button('.decrement', 'Decrement'),
          button('.increment', 'Increment'),

          // Display current counter value
          p('Counter: ' + count)
        ])

      )
  };
}

Cycle.run(main, {
  // DOM: makeDOMDriver('#main-container')
  DOM: makeDOMDriver(document.body)
});
