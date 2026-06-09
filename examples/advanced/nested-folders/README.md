# Cycle.js Nested Folders example

This example renders folders that can add and remove nested child folders.

This is good for:

- Using `cycle-onionify` for nested state
- Managing recursive component collections
- Combining parent reducers with child reducers

## How it works

`Folder` models its own add/remove actions as reducer streams. Child folders are
managed through `makeCollection()`, keyed by each child folder id and scoped to
the `children` state branch. The parent combines its own reducer stream with
the child onion reducer stream, while combining child DOM streams for rendering.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/advanced/nested-folders/index.html`
