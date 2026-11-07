# Counter

## Learn
Keep state in a fold instead of mutating DOM in click handlers.

## Flow
[Source](./src/main.js) maps decrement/increment clicks to -1/+1, merges them,
folds from zero, and maps count to buttons and text.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. See [shared setup](../../RUNNING.md).

## Limits
The count is not stored across reloads. No production compatibility matrix is
implied by this demonstration.
