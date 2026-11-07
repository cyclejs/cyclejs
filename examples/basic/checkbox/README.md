# Checkbox

## Learn
Translate a DOM event into boolean state, then render that state.

## Flow
[Source](./src/main.js) maps input change events to `checked`, seeds false with
`startWith`, and renders ON/off. The DOM driver performs browser effects.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. See [shared setup](../../RUNNING.md).

## Limits
This is transient state, not persistence or form submission. The offline check
does not certify historical dependency compatibility.
