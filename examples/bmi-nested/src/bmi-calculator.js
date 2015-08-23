import {Rx} from '@cycle/core';
import {h} from '@cycle/dom';
import labeledSlider from './labeled-slider';

function bmiCalculator({DOM}) {
  let initialWeight = 70;
  let initialHeight = 170;
  let weightProps$ = Rx.Observable.just({
    label: 'Weight',
    unit: 'kg',
    min: 40,
    initial: initialWeight,
    max: 140
  });
  let heightProps$ = Rx.Observable.just({
    label: 'Height',
    unit: 'cm',
    min: 140,
    initial: initialHeight,
    max: 210
  });
  let weightSlider = labeledSlider({DOM, props$: weightProps$}, '.weight');
  let heightSlider = labeledSlider({DOM, props$: heightProps$}, '.height');

  let bmi$ = Rx.Observable.combineLatest(
    weightSlider.newValue$.startWith(initialWeight),
    heightSlider.newValue$.startWith(initialHeight),
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

export default bmiCalculator;
