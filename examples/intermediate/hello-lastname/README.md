# Hello Lastname

## Learn
Combine field streams and partition valid and invalid state.

## Flow
[Source](./src/index.ts) seeds both inputs, uppercases the last name and remembers
their combined tuple. A nonempty first name and last name of at least three
characters produce `LAST, First`; invalid input clears the result.

## Run
From this directory use `npm start`; TypeScript builds before bundling
`lib/index.js`. Open `index.html` after success. See [shared setup](../../RUNNING.md).

## Limits
The length rule is a stream demonstration, not a real-name validation policy.
No persistence or international-name correctness is implied.
