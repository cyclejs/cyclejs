# Isomorphic

## Learn
Study how a shared view can receive server context and later browser events.

## Flow
[Source](./app.js) maps initial context and link clicks to home/about views.
[Server](./server.js) bundles the client, supplies request-route context, wraps
the resulting VTree in HTML and serves it with Express. [Client](./client.js)
uses the DOM driver, drops the first view and supplies preventDefault effects.

## Run
The historical command is `npm start`, which installs dependencies and runs
`babel-node ./server.js`; it is not an index.html example. The listener uses
`PORT` or 3000. Read [shared setup](../../RUNNING.md) before attempting execution.

## Limits
Current source imports `makeHTMLDriver` from `@cycle/dom`, a legacy API needing
migration to the separate HTML driver. Its browser history and bundling code
also predate current APIs. This guide documents the source; it does not claim
working SSR, hydration, back/forward handling or deployment security. The separate
issue #686 addresses that migration; no implementation from it is included here.
