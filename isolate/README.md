# Isolate

A utility function to make scoped dataflow components in Cycle.js.

```
npm install @cycle/isolate
```

See the Cycle.js [documentation on components](http://cycle.js.org/components.html#multiple-instances-of-the-same-component) for further details.

## Example

```js
import isolate from '@cycle/isolate';
import LabeledSlider from './LabeledSlider';

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

# API


- [`isolate`](#isolate)

### <a id="isolate"></a> `isolate(component, scope)`

Takes a `component` function and an optional `scope` string, and returns a
scoped version of the `component` function.

When the scoped component is invoked, each source provided to the scoped
component is isolated to the given `scope` using
`source.isolateSource(source, scope)`, if possible. Likewise, the sinks
returned from the scoped component are isolated to the `scope` using
`source.isolateSink(sink, scope)`.

If the `scope` is not provided, a new scope will be automatically created.
This means that while **`isolate(component, scope)` is pure**
(referentially transparent), **`isolate(component)` is impure**
(not referentially transparent). Two calls to `isolate(Foo, bar)` will
generate the same component. But, two calls to `isolate(Foo)` will generate
two distinct components.

Note that both `isolateSource()` and `isolateSink()` are static members of
`source`. The reason for this is that drivers produce `source` while the
application produces `sink`, and it's the driver's responsibility to
implement `isolateSource()` and `isolateSink()`.

#### Arguments:

- `component: Function` a function that takes `sources` as input and outputs a collection of `sinks`.
- `scope: String` an optional string that is used to isolate each `sources` and `sinks` when the returned scoped component is invoked.

#### Return:

*(Function)* the scoped component function that, as the original `component` function, takes `sources` and returns `sinks`.

- - -

