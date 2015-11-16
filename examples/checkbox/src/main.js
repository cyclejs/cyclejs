import Cycle from '@cycle/core';
import {div, input, p, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  let sinks = {
    DOM: sources.DOM.select('input').events('change')
      .map(ev => ev.target.checked)
      .startWith(false)
      .map(toggled =>
        div([
          input({type: 'checkbox'}), 'Toggle me',
          p(toggled ? 'ON' : 'off')
        ])
      )
  };
  return sinks;
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
