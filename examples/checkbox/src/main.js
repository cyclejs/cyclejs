// Checkbox: Basic Example 

import Cycle from '@cycle/xstream-run';
import {div, input, p, label, makeDOMDriver} from '@cycle/dom';

// logger utility to inject into streams for inspection
const show = x => {
  // console.log(JSON.stringify(x))
  console.log(x)
  return x
}

function main(sources) {

  // -> get stream of virtual doms views : Stream<vNode>
  let vNode$ = sources.DOM

    // 'input' selected from the current view 
    // passed inside sources from previous iteration
    .select('input')

    // -> map events into : Stream<ev>
    .events('change')

    // -> checked state : Stream<Boolean>
    .map(ev => {
      ev.preventDefault()
      return ev.target.checked
    })
    .startWith(false)

    // Stream<Boolean> -> Stream<vNode>
    .map(toggled =>

      // virtual dom node
      div([
        label(
          { 
            // make button slightly prettier
            style: {
              background: '#eee',
              padding: '5px'
            } 
          }, 
          [
            input({attrs: {type: 'checkbox'}}), 
            'Toggle me',
          ]
        ),
        p(toggled ? 'ON' : 'off')
      ])
    )

  return {
    DOM: vNode$,
  }
}

Cycle.run(main, {
  // DOM: makeDOMDriver('#main-container')
  // Inject directly into 'body' 
  // to work with 'budo's stabbed html file
  DOM: makeDOMDriver(document.body)
});
