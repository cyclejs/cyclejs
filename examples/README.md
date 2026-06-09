# Cycle.js Examples

Browse and learn from examples of small Cycle.js apps using Core, DOM Driver, HTML Driver, HTTP Driver, JSONP Driver, and others.

## Usage

1.  Open the directory of an example in your terminal.
2.  Type `npm start`
3.  Open the `index.html` of that example in your browser, with the full path, e.g. `file:///Users/myself/cycle-examples/jsx-seconds-elapsed/index.html`

## Testing examples locally

From the repository root, run `pnpm run test-examples` to build the local
`@cycle/*` packages and then install/build every runnable example against those
local packages in a temporary directory. This keeps each example's explicit
published dependency versions intact while still catching breakage from changes
in the monorepo packages.

To test a single example, pass its path to the script after `--`, for example:

```sh
pnpm run test-examples -- examples/advanced/isomorphic
```

## Study guide

Start with the examples under the basic folder in this order:

1. hello-world
2. checkbox
3. counter
4. http-random-user
5. bmi-naive

This will get you introduced to one main concept with each example. Make sure
to reach for each example's README file for more context.
