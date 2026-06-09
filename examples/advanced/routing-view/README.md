# Cycle.js Routing View example

This example renders different page views from hash history state.

This is good for:

- Using the History driver as both a source and a sink
- Mapping navigation clicks into route changes
- Rendering views from the current history object

## How it works

Navigation clicks are mapped to page names and sent to the History driver. The
app reads the current history source, chooses a page view from the pathname, and
renders both the navigation menu and a JSON representation of the history object.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/advanced/routing-view/index.html`
