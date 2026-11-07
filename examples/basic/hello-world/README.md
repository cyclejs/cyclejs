# Cycle.js Hello World example

This is a very small Cycle.js program. It just echoes anything written
in the text field.

This is good for:

- Learning the basic structure of a Cycle.js program
- Starting to think in streams
- Learning how to read events from and write HTML to the DOM Driver

## Learn
Follow DOM input events through mapping and an initial value into a greeting.

## Flow
[Source](./src/main.js) selects `.myinput`, maps the input value, seeds an empty
name with `startWith`, and renders a label/input/greeting through the DOM driver.

## Run

1.  Type `npm start`
2.  Open the `index.html` in your browser, with the full path,
e.g. `file:///Users/myself/cyclejs/examples/basic/hello-world/index.html`

See [shared setup](../../RUNNING.md) for dependency and browser entrypoint details.

## Limits
This example has no stored state or backend. Its historical build dependencies
are not certified by the offline documentation check.
