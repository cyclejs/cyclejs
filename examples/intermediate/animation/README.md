# Animation

## Learn
Sequence tweens and switch to a newly started animation on input.

## Flow
[Source](./src/main.js) creates horizontal, vertical and circular-return tweens.
A click maps to their concatenation; `flatten` switches to the latest sequence.
Coordinates become inline target styles.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build and click Animate it. See [shared setup](../../RUNNING.md).

## Limits
This uses xstream's tween utility, not the Time driver. Timing is illustrative,
with no reduced-motion or performance guarantee.
