# Isomorphic Example

The same `app.js` renders on the server with `@cycle/html` and in the browser
with `@cycle/dom`. `server.js` waits for the esbuild client bundle before
listening; `client.js` reads the server context and attaches the DOM driver.
Links, history navigation, and direct route reloads use the same app.

## Run

Use Node 20.19 or newer. From this directory:

```sh
npm install
npm start
```

Open http://127.0.0.1:3000. `PORT` and `HOST` can override the development
listener; its default is loopback only. Starting does not implicitly install
packages. This is a development example, not a production deployment template.

## Compatibility

The Cycle dependencies use the published versions checked for this update:
DOM 23.1.0, HTML 3.4.0, run 5.7.0, and xstream 11.14.0. The old Babel/Browserify
pipeline cannot consume the current DOM dependency graph, so the example uses
native ESM and esbuild instead. The repository's legacy Node 8 requirement
does not apply to this example's new toolchain.

`view.js` shares the HTML driver's compatible Snabbdom 0.7 VNode constructors
without importing browser-only DOM modules on the server. Context is encoded
as a DOM attribute and parsed as JSON, avoiding HTML-escaped executable script
text. Browser-only imports stay in `client.js`.

## Test

```sh
npm test
```

The HTTP tests start their own ephemeral loopback server and close it afterward.
They check server-rendered routes, query strings, the client bundle, and favicon.

For actual browser tests, set `CHROME_BIN` to an installed Chrome/Chromium
executable and run `npm run test:browser`. This uses an isolated profile and
fails clearly if no browser is specified; it does not download a browser or
use a cloud account. It checks desktop and mobile navigation, history,
reloads, console exceptions, and server rendering with JavaScript disabled.
Screenshots are written to `EVIDENCE_DIR` if set, or a new temporary directory.
These are Chromium checks, not a full Firefox/Safari or operating-system matrix.
