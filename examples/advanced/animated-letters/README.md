# Animated Letters

## Learn
Turn differences between successive states into animated transition state.

## Flow
[Source](./src/main.js) reads document keydown events and toggles single-letter
keys in a sorted list. Pairwise differences create entering/leaving points;
Time ticks repeatedly move their values toward targets and font size renders
those values. Removed letters remain until their animation reaches zero.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build and press letter keys. See [shared setup](../../RUNNING.md).

## Limits
This uses physical keyboard codes and illustrative periodic animation, not full
text input, international keyboard handling or measured display-frame timing.
