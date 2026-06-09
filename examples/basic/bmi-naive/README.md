# Cycle.js BMI naive example

This example calculates BMI from two range sliders: weight and height.

This is good for:

- Combining independent input streams into one state stream
- Deriving calculated values from UI state
- Seeing the BMI app written inline before it is split into components in
  later examples

## How it works

The app listens to input events from the weight and height sliders. Each stream
starts with a default value, and `Observable.combineLatest()` combines the
latest weight and height into a state object containing `weight`, `height`, and
`bmi`. That state is mapped to a virtual DOM tree with two sliders and the
calculated BMI.

## Usage

1. Type `npm start`
2. Open the `index.html` in your browser, with the full path,
   e.g. `file:///Users/myself/cyclejs/examples/basic/bmi-naive/index.html`
