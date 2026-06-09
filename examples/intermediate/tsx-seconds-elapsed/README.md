# Cycle.js TSX seconds elapsed example

This example displays elapsed seconds using TypeScript and TSX.

This is good for:

- Typing Cycle.js sources and sinks
- Using the Time driver with TypeScript
- Rendering virtual DOM with TSX

## How it works

The Time driver emits once per second. The stream is incremented from zero,
starts immediately with `0`, and is mapped to TSX that displays the elapsed
seconds. The source and sink types describe the DOM and Time driver inputs and
the DOM stream output.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/intermediate/tsx-seconds-elapsed/index.html`
