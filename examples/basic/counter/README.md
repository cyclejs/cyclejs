# Cycle.js Counter example

This example renders increment and decrement buttons and keeps a running count.

This is good for:

- Combining multiple DOM event streams with `xs.merge()`
- Representing user intent as small action values
- Accumulating state over time with `fold()`

## How it works

Clicking the decrement button emits `-1`, and clicking the increment button
emits `+1`. These action streams are merged and folded into a count stream.
The count stream is mapped to a virtual DOM tree that displays both buttons
and the current count.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/basic/counter/index.html`
