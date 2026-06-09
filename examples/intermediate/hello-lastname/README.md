# Cycle.js Hello Lastname example

This example combines first-name and last-name inputs into a formatted greeting.

This is good for:

- Combining streams with `xs.combine()`
- Splitting valid and invalid state into separate streams
- Using TypeScript interfaces for Cycle.js sources and sinks

## How it works

The app reads first-name and last-name input events from the DOM. The last name
is uppercased, and both streams are combined into one remembered name stream.
Valid names are formatted as `LAST, First`; invalid names produce an empty
greeting. The merged output stream is rendered as a form and heading.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/intermediate/hello-lastname/index.html`
