import Chart from 'chart.js'
import {Observable} from 'rx'

export function makeChartDriver(selector, settings) {
    let instance = null // lazy initialize chart on first stream event
    const el = document.querySelector(selector)

    if (!el) {
        throw new Error(`No element '${selector}' found`)
    }

    return function chartDriver(sink$) {
        sink$.take(1).subscribe(createChart)
        sink$.subscribe(updateChart)

        return {
            events: createEvent,
        }
    }

    function updateChart(data) {
        Object.keys(data)
            .filter(key => key !== 'datasets')
            .forEach(key => instance.data[key] = data[key])

        data.datasets.forEach((dataset, index) => {
            Object.assign(instance.data.datasets[index], dataset)
        })

        instance.update()
    }

    function createChart(data) {
        const ctx = el.getContext('2d')
        settings.data = data
        instance = new Chart(ctx, settings)
    }

    function createEvent(evName) {
        return Observable.fromEvent(el, evName)
            .filter(() => instance)
            .map((ev) => instance.getElementsAtEvent(ev))
    }
}
