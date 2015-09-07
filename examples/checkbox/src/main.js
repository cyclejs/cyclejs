import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';

function main(responses) {
  let requests = {
    DOM: responses.DOM.select('input').events('change')
      .map(ev => ev.target.checked)
      .startWith(false)
      .map(toggled =>
        h('div', [
          h('input', {type: 'checkbox'}), 'Toggle me',
          h('p', toggled ? 'ON' : 'off')
        ])
      )
  };
  return requests;
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
