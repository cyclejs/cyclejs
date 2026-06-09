# Cycle.js Checkbox example

This example renders a checkbox and displays whether it is on or off.

This is good for:

- Reading DOM events with `sources.DOM.select(...).events(...)`
- Turning browser event objects into application state
- Using `startWith()` to provide an initial UI state before the first event

## How it works

The program listens to `change` events from the checkbox input, maps each event
to `event.target.checked`, and starts the stream with `false`. Each boolean
value is then mapped to a virtual DOM tree that contains the checkbox and the
current text state.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/basic/checkbox/index.html`
