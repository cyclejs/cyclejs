import Cycle from '@cycle/core'
import {makeDOMDriver} from '@cycle/dom'
import {Observable} from 'rx'
import {makeChartDriver} from './chart-driver'

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

Cycle.run(main, {
    DOM: makeDOMDriver('body'),
    Chart: makeChartDriver('#clicks-chart', chartDefaults),
})

function intent(DOM) {
    return {
        click$: DOM.events('click').map(() => 1),
        timer$: Observable.interval(2000).map(() => 0),
    }
}

function model(actions) {
    const clicksHistory$ = Observable.merge(actions.click$, actions.timer$)
        .scan((clicksCount, action) => {
            return action ? clicksCount + action : 0
        }, 0)
        .filter(action => action !== 0)
        .scan((history, clicksCount) => {
            if (clicksCount === 1) {
                return history.concat(clicksCount)
            }

            history[history.length - 1]++
            return history
        }, [])
        .startWith([0])

    return clicksHistory$
}

function view(clicksHistory$) {
    return clicksHistory$.map((history) => ({
        labels: history.map((n, i) => i),
        datasets: [{
            label: 'Clicks per second',
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
