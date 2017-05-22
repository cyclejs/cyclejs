import Cycle from '@cycle/xstream-run'
import Chart from 'chart.js'
import { makeDOMDriver, h1, div, canvas } from '@cycle/dom'
import xs from 'xstream'

const timeframeSec = 1
const settings = {
  type: 'bar',
  options: {
    scales: {
      yAxes: [{
        ticks: {
          beginAtZero: true,
        },
      }],
    },
  },
}

let chart = null

function createChart(selector, data) {
  settings.data = data
  chart = new Chart(selector, settings)
  return chart
}

function updateChart(data) {
  Object.keys(data)
    .filter(key => key !== 'datasets')
    .forEach(key => chart.data[key] = data[key])

  data.datasets.forEach((dataset, index) => {
    Object.assign(chart.data.datasets[index], dataset)
  })

  chart.update()
  return chart
}

function intent(DOMSource) {
  return {
    click$: DOMSource.events('click').mapTo(1),
    timer$: xs.periodic(timeframeSec * 1000).mapTo(0),
  }
}

function model(actions) {
  const clicksHistory$ = xs.merge(actions.click$, actions.timer$)
    .fold((clicksCount, action) => action ? clicksCount + action : 0, 0)
    .filter(action => action !== 0)
    .fold((history, clicksCount) => {
      if (clicksCount === 1) {
        return history.concat(clicksCount)
      }
      history[history.length - 1]++
        return history
    }, [])
  return clicksHistory$
}

function view(clicksHistory$) {
  return clicksHistory$.map((history) => {
    const data = {
      labels: history.map((n, i) => i),
      datasets: [{
        label: `Clicks per ${timeframeSec} second`,
        data: history,
        backgroundColor: '#3498db',
      }],
    }

    return canvas({
      hook: {
        insert: (vnode) => { createChart(vnode.elm, data) },
        update: () => { updateChart(data) }
      }
    })
  })
}

function main(sources) {
  const actions = intent(sources.DOM)
  const clicksHistory$ = model(actions)
  const vtree$ = view(clicksHistory$)

  return {
    DOM: vtree$,
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver('body')
})
