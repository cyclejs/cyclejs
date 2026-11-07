# Many

## Learn
Manage a dynamic collection of isolated child components and feedback events.

## Flow
[Source](./src/main.js) runs [List](./src/List.js). Each [Item](./src/Item.js) exposes
DOM and Remove; stable generated IDs key views and associate removal events.
The list folds add/remove reducers and uses a proxy stream to feed child removal
back into parent intent. Each item has independent color and width controls.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. See [shared setup](../../RUNNING.md).

## Limits
Add Many requests 1000 children and may be expensive. It is a composition example,
not a performance guarantee or persisted list/database implementation.
