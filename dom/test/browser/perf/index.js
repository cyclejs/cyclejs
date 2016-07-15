import {run} from '@cycle/core'
import {h, makeDOMDriver} from './../../../src/cycle-dom.js'
const Rx = require(`rx`)

// InputCount component
function InputCount(sources) {
  const id = `.component-count`
  const initialValue$ = sources.value$.take(1)
  const newValue$ = sources.DOM
    .select(id)
    .events(`input`)
    .map(ev => ev.target.value)
  const value$ = initialValue$.concat(newValue$)

  return {
    DOM: value$.map(
      (value) => h(`input${id}`, {
        type: `range`,
        max: `512`,
        min: `1`,
        value,
        style: {
          width: `100%`
        }
      })
    ),
    value$
  }
}

// CycleJSLogo component
function CycleJSLogo(id) {
  return {
    DOM: Rx.Observable.just(
      h(`div`, {
        style: {
          alignItems: `center`,
          background: `url(cyclejs_logo.svg)`,
          boxSizing: `border-box`,
          display: `inline-flex`,
          fontFamily: `sans-serif`,
          fontWeight: `700`,
          fontSize: `8px`,
          height: `32px`,
          justifyContent: `center`,
          margin: `8px`,
          width: `32px`
        }
      }, `${id}`)
    )
  }
}

// Main
function main(sources) {
  const inputCount = InputCount({
    DOM: sources.DOM, value$: Rx.Observable.just(64)
  });

  const component$s$ = inputCount.value$.map(
    (value) => Array.apply(null, Array(parseInt(value)))
        .map((v, i) => CycleJSLogo(i + 1).DOM)
  )

  return {
    DOM: inputCount.value$.combineLatest(
      inputCount.DOM,
      component$s$,
      (value, inputCountVTree, componentDOMs) => h(`div`, [
        h(`h2`, `# of Components: ${value}`),
        inputCountVTree,
        h(`div`, componentDOMs)
      ])
    )
  }
}

run(main, {
  DOM: makeDOMDriver(`.app`)
})
