# `isolate()`

> A utility function to make scoped dataflow components in Cycle.js.

## Installing

[![npm version](https://badge.fury.io/js/%40cycle%2Fisolate.svg)](http://badge.fury.io/js/%40cycle%2Fisolate)

`npm install @cycle/isolate`

## Example

```js
function bmiCalculator({DOM}) {
  let weightProps$ = Rx.Observable.just({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  });
  let heightProps$ = Rx.Observable.just({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  });

  // LabeledSlider is a dataflow component
  // isolate(LabeledSlider) is an impure function: it generates
  // a NEW dataflow component every time it is called.
  let WeightSlider = isolate(LabeledSlider);
  let HeightSlider = isolate(LabeledSlider);

  let weightSlider = WeightSlider({DOM, props$: weightProps$});
  let heightSlider = HeightSlider({DOM, props$: heightProps$});

  let bmi$ = Rx.Observable.combineLatest(
    weightSlider.value$,
    heightSlider.value$,
    (weight, height) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    }
  );

  return {
    DOM: bmi$.combineLatest(weightSlider.DOM, heightSlider.DOM,
      (bmi, weightVTree, heightVTree) =>
        h('div', [
          weightVTree,
          heightVTree,
          h('h2', 'BMI is ' + bmi)
        ])
      )
  };
}
```

## Documentation

### <a id="isolate"></a> `isolate(dataflowComponent, scope)`

Takes a `dataflowComponent` function and an optional `scope` string, and
returns a scoped version of the `dataflowComponent` function.

When the scoped dataflow component is invoked, each source provided to the
scoped dataflowComponent is isolated to the scope using
`source.isolateSource(source, scope)`, if possible. Likewise, the sinks
returned from the scoped dataflow component are isolate to the scope using
`source.isolateSink(sink, scope)`.

If the `scope` is not provided, a new scope will be automatically created.
This means that **`isolate(dataflowComponent)` is impure** (not referentially
transparent). Two calls to `isolate(Foo)` will generate two distinct dataflow
components.

Note that both `isolateSource()` and `isolateSink()` are static members of
`source`. The reason for this is that drivers produce `source` while the
application produces `sink`, and it's the driver's responsibility to
implement `isolateSource()` and `isolateSink()`.

#### Arguments:

- `dataflowComponent :: Function` a function that takes `sources` as input and outputs a collection of `sinks`.
- `scope :: String` an optional string that is used to isolate each `sources` and `sinks` when the returned scoped dataflow component is invoked.

#### Return:

*(Function)* the scoped dataflow component function that, as the original `dataflowComponent` function, takes `sources` and returns `sinks`.

- - -

## LICENSE

[The MIT License (MIT)](https://github.com/cyclejs/isolate/blob/master/LICENSE)

- - -

[![Build Status](https://travis-ci.org/cyclejs/isolate.svg?branch=master)](https://travis-ci.org/cyclejs/isolate)
[![Dependency Status](https://david-dm.org/cyclejs/isolate.svg)](https://david-dm.org/cyclejs/isolate)
[![devDependency Status](https://david-dm.org/cyclejs/isolate/dev-status.svg)](https://david-dm.org/cyclejs/isolate#info=devDependencies)
