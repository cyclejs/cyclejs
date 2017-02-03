// Hello World: Basic Example

import Cycle from '@cycle/xstream-run';
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  return {
    DOM: sources.DOM.select('.myinput')

      // -> Stream of input events : Stream<Event>
      .events('input')

      // -> Stream<String>
      .map(ev => ev.target.value)

      // ensure to have some value before any events
      .startWith('')
      .map(name =>

        div([
          label('Name:'),
          input('.myinput', {attrs: {type: 'text'}}),
          hr(),

          // use template string
          h1(`Hello ${name}`)
        ])

      )
  };
}

Cycle.run(main, {
  // DOM: makeDOMDriver('#main-container')
  DOM: makeDOMDriver(document.body)
});
