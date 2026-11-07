# Running the Examples

These are historical learning packages, not a verified modern deployment matrix.
Read each README, source and package.json together; one latest Node/Cycle release
is not guaranteed to work for all examples.

## Browser Bundles

From a selected example directory, `npm start` installs its dependencies and runs
Browserify. Installation needs network access and may run lifecycle scripts;
inspect them in an environment you control. Do not disable integrity checks or
force incompatible upgrades just to obtain a green install.

Ordinary JavaScript examples create `dist/` and bundle `src/main.js` into
`dist/main.js`. TypeScript examples first run `tsc`: http-random-user,
bmi-typescript and hello-lastname bundle `lib/index.js`; tsx-seconds-elapsed
bundles `lib/index.jsx`. JSX also needs the local Babel configuration.

After a successful build, open that example's `index.html`; a local static HTTP
server rooted there is another option. External services still depend on browser
policies, CORS, quotas and uptime. Opening HTML does not prove a driver works.

## Server Example

Isomorphic instead installs dependencies and runs `babel-node ./server.js`.
Express uses `PORT` or 3000. The current HTML-driver import is legacy and needs
migration; this documentation does not repair or certify the server. Do not use
an occupied port or expose a development server publicly.

## Validation Boundaries

The offline check verifies guide coverage, local references and source parsing,
not dependency compatibility, external services or UI behavior. Most `test`
scripts intentionally exit with "no test specified"; that is not a passing test
suite. No live GitHub, Wikipedia, Google or JSONPlaceholder requests are needed
for documentation checks. Do not add credentials to work around quota errors.
