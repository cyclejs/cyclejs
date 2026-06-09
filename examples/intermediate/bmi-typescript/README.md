# Cycle.js BMI TypeScript example

This example rewrites the BMI calculator with typed, reusable components.

This is good for:

- Splitting a Cycle.js app into smaller components
- Isolating component DOM scopes with `@cycle/isolate`
- Typing component sources, sinks, and props streams in TypeScript

## How it works

`BmiCalculator` creates two isolated `LabeledSlider` components: one for weight
and one for height. Each slider receives a props stream and returns both a DOM
stream and a `value$` stream. The calculator combines the two value streams,
calculates BMI, and renders the two sliders with the result.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/intermediate/bmi-typescript/index.html`
