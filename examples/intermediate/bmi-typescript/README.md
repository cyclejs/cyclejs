# BMI TypeScript

## Learn
Type component contracts and compose isolated reusable controls.

## Flow
[Source](./src/index.ts) runs [BmiCalculator](./src/BmiCalculator.ts), which creates
isolated weight/height [LabeledSlider](./src/LabeledSlider.ts) instances. Each has
DOM and remembered numeric value streams; combined values produce rounded BMI.

## Run
From this directory use `npm start`; TypeScript builds before Browserify reads
`lib/index.js`. Open `index.html` after success. See [shared setup](../../RUNNING.md).

## Limits
Types describe stream contracts, not health validity or arbitrary numeric input.
This is not medical advice; source parsing is not a successful project build.
