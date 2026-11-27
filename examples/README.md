# Cycle.js Examples

Browse and learn from examples of small Cycle.js apps using Core, DOM Driver, HTML Driver, HTTP Driver, JSONP Driver, and others.

## Usage

1.  Open the directory of an example in your terminal.
2.  Type `npm start`
3.  Open the `index.html` of that example in your browser, with the full path, e.g. `file:///Users/myself/cycle-examples/jsx-seconds-elapsed/index.html`


## Example reference

| Example | What it demonstrates |
|---|---|
| `basic/hello-world` | Minimal DOM input/output cycle: read text input events and render them. |
| `basic/checkbox` | Boolean DOM state, event streams, and conditional rendering. |
| `basic/counter` | State accumulation with `fold`, increment/decrement intent, and rendering derived state. |
| `basic/http-random-user` | HTTP driver requests/responses, user-triggered requests, and rendering async data. |
| `basic/bmi-naive` | Multiple related inputs, derived calculations, and a small form before component extraction. |
| `basic/jsx-seconds-elapsed` | Time-based streams and JSX rendering with the DOM driver. |
| `intermediate/animation` | Animation timing, stream transformation, and continuous DOM updates. |
| `intermediate/bmi-typescript` | BMI calculator written in TypeScript with typed sources, sinks, and state. |
| `intermediate/hello-lastname` | Combining multiple input streams, validation, and derived display state. |
| `intermediate/http-search-github` | Debounced search input, HTTP requests, response selection, and result rendering. |
| `intermediate/tsx-seconds-elapsed` | Timer-driven rendering using TypeScript and TSX. |
| `advanced/animated-letters` | Letter-by-letter animation and more complex stream orchestration. |
| `advanced/autocomplete-search` | Autocomplete behavior with debouncing, cancellation/selection, and remote search results. |
| `advanced/bmi-nested` | Reusable nested components and isolation in the BMI example. |
| `advanced/custom-driver` | Writing and consuming a custom driver for an external effect. |
| `advanced/isomorphic` | Sharing application code between server rendering and browser execution. |
| `advanced/many` | Dynamic collections of component instances and list state management. |
| `advanced/nested-folders` | Hierarchical/nested data UI with recursive component structure. |
| `advanced/routing-view` | Route-driven application state and rendering different views. |

Every example directory contains its own `package.json`; run `npm install` when needed, then `npm start` or the command documented by that example.

## Study guide

Start with the examples under the basic folder in this order:

1. hello-world
2. checkbox
3. counter
4. http-random-user
5. bmi-naive

This will get you introduced to one main concept with each example. Make sure
to reach for each example's README file for more context.
