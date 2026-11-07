# JSX Seconds Elapsed

## Learn
Treat time as a driver source and express VNodes with JSX.

## Flow
[Source](./src/main.js) reads `Time.periodic(1000)`, maps ticks to seconds, seeds
zero, and renders with the configured `snabbdom-jsx` factory.

## Run
From this directory use `npm start`, then open `index.html` after a successful
JSX-aware build. See [shared setup](../../RUNNING.md).

## Limits
This counts emitted ticks, not wall-clock elapsed time. Browser timer throttling
and historical JSX configuration affect execution.
