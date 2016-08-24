import xs from 'xstream';
import {h2, div} from '@cycle/dom';
import LabeledSlider from './LabeledSlider';

function model(weightSliderValue$, heightSliderValue$) {
  return xs.combine(weightSliderValue$, heightSliderValue$)
    .map(([weight, height]) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    });
}

function view(bmi$, weightSliderDOM, heightSliderDOM) {
  return xs.combine(bmi$, weightSliderDOM, heightSliderDOM)
    .map(([bmi, weightVTree, heightVTree]) =>
      div([
        weightVTree,
        heightVTree,
        h2(`BMI is ${bmi}`)
      ])
    );
}

function BmiCalculator({DOM}) {
  let weightProps$ = xs.of({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  });
  let heightProps$ = xs.of({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  });
  let weightSlider = LabeledSlider({DOM, props$: weightProps$});
  let heightSlider = LabeledSlider({DOM, props$: heightProps$});
  let bmi$ = model(weightSlider.value, heightSlider.value);
  let vtree$ = view(bmi$, weightSlider.DOM, heightSlider.DOM);
  return {
      DOM: vtree$
  };
}

export default BmiCalculator;
