# BMI Nested

## Learn
Reuse isolated controls while keeping parent model and view composition separate.

## Flow
[Source](./src/main.js) runs [BmiCalculator](./src/BmiCalculator.js), passing
different props to two [LabeledSlider](./src/LabeledSlider.js) instances. Each
slider is isolated, exposes a remembered `value` stream and returns DOM. The
parent combines values into BMI and combines the child views with the result.

## Run
From this directory use `npm start`, then open `index.html` after a successful
build. See [shared setup](../../RUNNING.md).

## Limits
This JavaScript version exports `value`, unlike the typed example's `value$`.
BMI is a rounded demonstration, not medical advice or validated health software.
