# TSX Seconds Elapsed

## Learn
Combine typed sources/sinks, a JSX view and a Time driver.

## Flow
[Source](./src/index.tsx) declares DOM/Time sources and a JSX-element sink. Time
ticks become a counter starting at zero, rendered through `snabbdom-jsx`.

## Run
From this directory use `npm start`; TypeScript emits JSX before Browserify reads
`lib/index.jsx`. Open `index.html` after success. See [shared setup](../../RUNNING.md).

## Limits
TSX and Babel must agree on the JSX factory. This emitted-tick count is not a
precise stopwatch or a proven modern toolchain setup.
