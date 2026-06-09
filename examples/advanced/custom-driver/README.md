# Cycle.js Custom Driver example

This example counts clicks over time and renders the result through a chart
driver.

This is good for:

- Writing an app that outputs to a sink other than DOM
- Separating intent, model, and view streams
- Understanding how a custom driver can bridge Cycle.js streams to another UI
  library

## How it works

DOM clicks are merged with periodic Time driver ticks. The model folds these
events into a history of click counts per second. The view maps that history
into chart data, and the custom Chart driver renders the data into the chart
container.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/advanced/custom-driver/index.html`
