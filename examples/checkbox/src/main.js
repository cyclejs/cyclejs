import Cycle from '@cycle/xstream-run';
import {div, input, p, label, makeDOMDriver} from '@cycle/dom';

// logger utility
const show = x => {
  // console.log(JSON.stringify(x))
  console.log(x)
  return x
}

function main(sources) {

  // element emitting toggle event
  let toggleEl
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
      div([
        toggleEl = label(
          { 
            style: {border: 'solid thin', padding: '5px'} 
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
    // toggle$: sources.DOM.select(toggleEl).events('change')
  }
}

Cycle.run(main, {
  // DOM: makeDOMDriver('#main-container')
  DOM: makeDOMDriver(document.body)
});
