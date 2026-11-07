# HTTP Random User

## Learn
Separate outgoing requests from categorized incoming response streams.

## Flow
[Source](./src/index.ts) maps a click to a JSONPlaceholder user request tagged
`users`. It selects that category, flattens responses and renders profile fields,
initially showing no user.

## Run
From this directory use `npm start`; TypeScript builds before Browserify reads
`lib/index.js`. Open `index.html` after success. See [shared setup](../../RUNNING.md).

## Limits
An external service and browser network access are required. The sample does not
recover failed responses or validate remote profile/website values for production.
No live request is part of the documentation check.
