# Custom Driver

## Learn
Hide imperative canvas-library effects behind a Cycle driver boundary.

## Flow
[Source](./src/main.js) merges clicks with one-second timer resets and builds
per-interval click-count chart data. [Chart driver](./src/chart-driver.js) lazily
creates Chart.js on the first sink value, then updates its data and exposes
adapted canvas events. The current app only consumes DOM and Time sources.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build and click the page. See [shared setup](../../RUNNING.md).

## Limits
The driver uses legacy Chart.js APIs and has no explicit chart-destruction
contract. This is not a production resource-management or throughput benchmark.
