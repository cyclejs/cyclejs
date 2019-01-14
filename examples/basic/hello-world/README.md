# Cycle.js Hello World example

This is a very small Cycle.js program. It just echoes anything written
in the text field.

This is good for:

- Learning the basic structure of a Cycle.js program
- Starting to think in streams
- Learning how to read events from and write HTML to the DOM Driver

## Usage

1.  Type `npm start`
2.  Open the `index.html` in your browser, with the full path,
e.g. `file:///Users/myself/cyclejs/examples/basic/hello-world/index.html`

## Overview
First of all, we import the function `run(main, drivers)`, where `main` is the entry point for our whole application, and drivers is a record of driver functions labeled by some name, along with that we import `div()`, `label()`, `input()`, `hr()`, `h1()` helper functions used to create virtual DOM elements for the respective DOM elements. We start with a `main` function which takes `sources` as argument. We use sources.DOM.select(selector).events(eventType) to get a stream of eventType DOM events happening on the element(s) specified by selector, which in this case is `input` event to `myinput` class. `main()` function takes the stream of input events happening on input elements, and maps those events to Virtual DOM elements displaying a `h1` with the content.
