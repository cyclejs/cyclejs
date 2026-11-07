# HTTP GitHub Search

## Learn
Debounce user intent and keep unrelated HTTP categories out of a view.

## Flow
[Source](./src/main.js) debounces input by 500 ms through Time and sends `github`
search requests. It also sends two unrelated `google` requests. Selected GitHub
response streams are flattened into repository links.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. See [shared setup](../../RUNNING.md).

## Limits
Quotas, CORS, mixed-content restrictions and service uptime affect results. The
sample has no error recovery; flattening the response stream does not establish
latest-request ordering. No credentials or live calls are needed for doc checks.
