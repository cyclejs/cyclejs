# Cycle.js Examples

Browse and learn from examples of small Cycle.js apps using Core, DOM Driver, HTML Driver, HTTP Driver, JSONP Driver, and others.

## Usage

1.  Open the directory of an example in your terminal.
2.  Type `npm start`
3.  Open the `index.html` of that example in your browser, with the full path, e.g. `file:///Users/myself/cycle-examples/jsx-seconds-elapsed/index.html`

## Study guide

Start with the examples under the basic folder in this order:

1. hello-world
2. checkbox
3. counter
4. http-random-user
5. bmi-naive

This will get you introduced to one main concept with each example. Make sure
to reach for each example's README file for more context.

## Example reference

Every example demonstrates a small set of techniques; this table tells you what
each one covers, so you can jump straight to the idea you want to learn. Some of
the examples (currently hello-world and autocomplete-search) also have their own
README files with extra notes.

### Basic

| Example | Concepts demonstrated |
| --- | --- |
| [hello-world](basic/hello-world/) | The smallest Cycle.js app: a `main()` function that consumes a DOM source and returns a DOM sink, connected by `run()`. |
| [checkbox](basic/checkbox/) | Reading events and values from the DOM source with `DOM.select()` and `events()`, and mirroring the user's input state right back to the DOM. |
| [counter](basic/counter/) | The Intent–Model–View structure: merging the increment and decrement click streams into one model stream and rendering its state. |
| [http-random-user](basic/http-random-user/) | Request-driven data fetching with the `@cycle/http` driver: a click produces a request stream whose response is transformed and rendered. |
| [bmi-naive](basic/bmi-naive/) | Combining the latest values of two input streams with `combineLatest()` into a computed BMI, all inside a single `main()` without component isolation. |
| [jsx-seconds-elapsed](basic/jsx-seconds-elapsed/) | Writing the virtual DOM with JSX (compiled by Babel) for a stream that ticks with `@cycle/time`'s `periodic()`. |

### Intermediate

| Example | Concepts demonstrated |
| --- | --- |
| [animation](intermediate/animation/) | Animating a DOM element with `@cycle/time`'s `tween()` and easing curves: one click sequences several tweens (left, then down, then a circular return). |
| [hello-lastname](intermediate/hello-lastname/) | Typing the sources/sinks contract with TypeScript interfaces, combining two text inputs with `xs.combine()`, and merging the valid/invalid name streams into the final greeting. |
| [bmi-typescript](intermediate/bmi-typescript/) | The BMI calculator in TypeScript as nested components: a `BmiCalculator` component that mounts two isolated `LabeledSlider` children. |
| [http-search-github](intermediate/http-search-github/) | Debouncing input events with `@cycle/time` before firing `@cycle/http` requests, and flattening the arriving responses. |
| [tsx-seconds-elapsed](intermediate/tsx-seconds-elapsed/) | The timer example written with TypeScript and JSX (TSX). |

### Advanced

| Example | Concepts demonstrated |
| --- | --- |
| [animated-letters](advanced/animated-letters/) | Listening to global `keydown` events and collecting typed letters, with per-letter animation driven by `@cycle/time`'s `periodic()`. |
| [autocomplete-search](advanced/autocomplete-search/) | Querying an external API with the `@cycle/jsonp` driver and rendering suggestions as you type. |
| [bmi-nested](advanced/bmi-nested/) | The nested-component pattern: a `BmiCalculator` component that mounts `LabeledSlider` children by passing them `sources` and receiving their `sinks`. |
| [custom-driver](advanced/custom-driver/) | Making your own driver: `makeChartDriver()` drives Chart.js from the app's sinks, showing how a driver owns a piece of state. |
| [isomorphic](advanced/isomorphic/) | Splitting one app between server and client: the server renders with the `@cycle/html` driver and serializes the app context; the client resumes from `window.appContext` and uses a custom prevent-default driver. |
| [many](advanced/many/) | Dynamically created components: a list that can add one or one thousand items at once, each item being an isolated component with its own state and remove button. |
| [nested-folders](advanced/nested-folders/) | Recursive components: a `Folder` component that nests itself to arbitrary depth, with events flowing through every level of the isolation hierarchy. |
| [routing-view](advanced/routing-view/) | Switching between views (Home and About) with the `@cycle/history` driver and highlighting the active link in a navigation bar. |

