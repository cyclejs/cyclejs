import {Observable} from 'rx';
import {h2, div} from '@cycle/dom';
import isolate from '@cycle/isolate';
import LabeledSlider from './LabeledSlider';

function BmiCalculator({DOM}) {
  let WeightSlider = isolate(LabeledSlider);
  let HeightSlider = isolate(LabeledSlider);

  let weightProps$ = Observable.just({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  });
  let heightProps$ = Observable.just({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  });

  let weightSlider = WeightSlider({DOM, props$: weightProps$});
  let heightSlider = HeightSlider({DOM, props$: heightProps$});

  let bmi$ = Observable.combineLatest(
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
        div([
          weightVTree,
          heightVTree,
          h2('BMI is ' + bmi)
        ])
      )
  };
}

export default BmiCalculator;
