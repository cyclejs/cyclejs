# Routing View

## Learn
Keep navigation commands separate from the current history source.

## Flow
[Source](./src/main.js) maps nav clicks to a dataset page, drops repeated values
and emits the history sink. The hash-history driver supplies pathname state;
the view chooses home/about/contacts or a 404 heading and displays history data.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. Try the page navigation. See [shared setup](../../RUNNING.md).

## Limits
This is client-side hash navigation, not server routing or authentication. The
legacy driver must interpret emitted page values as intended; static parsing
does not prove navigation/back/forward behavior.
