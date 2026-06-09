# Cycle.js Animation example

This example animates a square through a sequence of movements after a button
click.

This is good for:

- Starting animation streams from DOM events
- Sequencing streams with `xstream/extra/concat`
- Using `xstream/extra/tween` to produce animated values

## How it works

Clicking the button starts a stream made from three tweened movement phases:
left-to-right, top-to-bottom, and a circular return. The phases are concatenated
so they run in order. Each emitted coordinate is mapped to inline styles for the
target square.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/intermediate/animation/index.html`
