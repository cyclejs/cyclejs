# Autocomplete search example

Equivalent to a ClojureScript example by @swannodette: http://swannodette.github.io/2013/08/17/comparative/

## Learn
Combine focus, pointer and keyboard intent with asynchronous suggestions.

## Flow
[Source](./src/main.js) wires DOM, Time, JSONP and a custom preventDefault driver.
[App](./src/app.js) debounces focused input, queries Wikipedia OpenSearch,
reduces highlight/selection state with Immutable.Map and renders the menu.
Mouse-down/up windows distinguish selecting a suggestion from leaving the field.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. See [shared setup](../../RUNNING.md). After installing dependencies:

Run `npm run live` to use this app with hot reloading enabled: change the source
code and save the file to see near instant updates to the app, without resetting
the app's state.

## Limits
Wikipedia JSONP, browser script policy and legacy dependencies affect execution.
This is not a complete accessible combobox or an error-recovery demonstration.
The offline check does not call Wikipedia or verify hot reloading.
