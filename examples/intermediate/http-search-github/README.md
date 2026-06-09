# Cycle.js HTTP search GitHub example

This example searches GitHub repositories from a text input.

This is good for:

- Debouncing DOM input before making HTTP requests
- Filtering HTTP responses by request category
- Ignoring unrelated HTTP responses in the same app

## How it works

Input events from the search field are debounced through the Time driver. Each
non-empty query becomes a categorized GitHub API request. The app also emits a
separate Google request stream to demonstrate why response categories matter.
Only `github` responses are selected, flattened, and rendered as a list of
repository links.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/intermediate/http-search-github/index.html`
