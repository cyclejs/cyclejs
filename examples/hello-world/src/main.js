import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';

function main(responses) {
  return {
    DOM: responses.DOM.get('.myinput', 'input')
      .map(ev => ev.target.value)
      .startWith('')
      .map(name =>
        h('div', [
          h('label', 'Name:'),
          h('input.myinput', {attributes: {type: 'text'}}),
          h('hr'),
          h('h1', `Hello ${name}`)
        ])
      )
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
