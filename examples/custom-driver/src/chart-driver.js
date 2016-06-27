import Chart from 'chart.js'
import xs from 'xstream'
import fromEvent from 'xstream/extra/fromEvent'

export function makeChartDriver(selector, settings) {
  let instance = null // lazy initialize chart on first stream event
  const el = document.querySelector(selector)
  if (!el) {
    throw new Error(`No element '${selector}' found`)
  }

  function createChart(data) {
    const ctx = el.getContext('2d')
    settings.data = data
    instance = new Chart(ctx, settings)
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

  function createEvent(evName) {
    return fromEvent(el, evName)
      .filter(() => instance)
      .map((ev) => instance.getElementsAtEvent(ev))
  }

  return function chartDriver(sink$) {
    sink$.take(1).addListener({
      next: createChart,
      error: () => {},
      complete: () => {}
    })
    sink$.addListener({
      next: updateChart,
      error: () => {},
      complete: () => {}
    })

    return {
      events: createEvent,
    }
  }
}
