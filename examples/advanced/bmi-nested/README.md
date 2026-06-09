# Cycle.js BMI nested example

This example builds the BMI calculator from nested JavaScript components.

This is good for:

- Comparing JavaScript component composition with the TypeScript BMI example
- Passing props streams into reusable child components
- Combining child sink streams in a parent component

## How it works

The root app delegates to `BmiCalculator`, which creates two reusable slider
components. Each slider emits a DOM stream and a value stream. The parent
combines the weight and height values to calculate BMI, then combines that BMI
with the slider DOM streams to render the complete UI.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/advanced/bmi-nested/index.html`
