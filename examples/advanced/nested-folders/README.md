# Nested Folders

## Learn
Compose recursive stateful components using onion reducers and collections.

## Flow
[Source](./src/main.js) applies onionify to [Folder](./src/Folder.js). A folder
initializes state, adds child state or returns undefined to remove itself.
`makeCollection` recursively builds children, isolates their `children` state,
merges reducer sinks and combines child views.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. See [shared setup](../../RUNNING.md).

## Limits
This uses the historical `cycle-onionify` API rather than current state-package
examples. Random IDs are not collision-proof and this does not access folders
on disk or persist a filesystem.
