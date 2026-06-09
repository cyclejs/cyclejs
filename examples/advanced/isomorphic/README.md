# Cycle.js Isomorphic example

This example renders the same Cycle.js app on the server and in the browser.

This is good for:

- Seeing how one app function can support server and client rendering
- Using a PreventDefault sink to keep link navigation inside the app
- Passing route context into an app during initial render

## How it works

The shared `app.js` file renders a small two-page app from a route context.
On the server, the route comes from the incoming request. On the client, link
clicks are converted into new route context values and `history.pushState()`
updates the URL. The same view code handles both environments.

## Usage

1. Type `npm start`
2. Open the local URL printed by the server
