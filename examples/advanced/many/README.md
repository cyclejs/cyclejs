# Cycle.js Many example

This example creates, edits, and removes many isolated item components.

This is good for:

- Managing dynamic collections of child components
- Using `isolate()` so repeated components do not share DOM scopes
- Combining child DOM streams and child remove streams

## How it works

The list component turns add and remove events into reducer functions over an
array of item records. New records create isolated item components with random
color and width props. Each child exposes a DOM stream and a remove stream; the
parent combines child DOM streams for rendering and merges child remove streams
back into list actions.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/advanced/many/index.html`
