import xs from 'xstream';
import {h2, div} from '@cycle/dom';
import isolate from '@cycle/isolate';
import LabeledSlider from './LabeledSlider';

function BmiCalculator({DOM}) {
  let WeightSlider = isolate(LabeledSlider);
  let HeightSlider = isolate(LabeledSlider);

  let weightProps$ = xs.of({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  });
  let heightProps$ = xs.of({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  });

  let weightSlider = WeightSlider({DOM, props$: weightProps$});
  let heightSlider = HeightSlider({DOM, props$: heightProps$});

  let bmi$ = xs.combine(
    (weight, height) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    },
    weightSlider.value$, heightSlider.value$
  );

  return {
    DOM: xs.combine(
      (bmi, weightVTree, heightVTree) =>
        div([
          weightVTree,
          heightVTree,
          h2('BMI is ' + bmi)
        ]),
      bmi$, weightSlider.DOM, heightSlider.DOM
    )
  };
}

export default BmiCalculator;
