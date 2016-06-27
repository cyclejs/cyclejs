import Cycle from '@cycle/xstream-run'
import {makeDOMDriver} from '@cycle/dom'
import xs from 'xstream'
import {makeChartDriver} from './chart-driver'

const timeframeSec = 1
const chartDefaults = {
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
  return clicksHistory$.map((history) => ({
    labels: history.map((n, i) => i),
    datasets: [{
      label: `Clicks per ${timeframeSec} second`,
      data: history,
      backgroundColor: '#3498db',
    }],
  }))
}

function main(sources) {
  const actions = intent(sources.DOM)
  const clicksHistory$ = model(actions)
  const chartData$ = view(clicksHistory$)

  return {
    Chart: chartData$,
  }
}

Cycle.run(main, {
  DOM: makeDOMDriver('body'),
  Chart: makeChartDriver('#clicks-chart', chartDefaults),
})
