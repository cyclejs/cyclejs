# BMI Naive

## Learn
Combine independently changing inputs into derived state and a view.

## Flow
[Source](./src/main.js) uses the RxJS runner, legacy `Observable.combineLatest`
and prototype operators. Weight starts at 70 kg and height at 170 cm; the model
converts height to meters and rounds BMI before rendering controls and result.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. See [shared setup](../../RUNNING.md).

## Limits
This is an older RxJS API, not RxJS 6 pipeable operators; dependency ranges may
need reconciliation. It is not medical advice or a validated health calculator.
