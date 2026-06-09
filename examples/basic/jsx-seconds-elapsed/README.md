# Cycle.js JSX seconds elapsed example

This example displays how many seconds have elapsed since the app started.

This is good for:

- Using the Time driver to produce periodic events
- Rendering Cycle.js virtual DOM with JSX
- Seeing the JavaScript version of the TSX seconds elapsed example

## How it works

The Time driver emits a value once per second. The stream is incremented from
zero, starts immediately with `0`, and is mapped to JSX that displays the
elapsed seconds.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/basic/jsx-seconds-elapsed/index.html`
