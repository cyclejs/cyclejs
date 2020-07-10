import xs from 'xstream';
import {h2, div} from '@cycle/dom';
import LabeledSlider from './LabeledSlider';

function model(weightSliderValue$, heightSliderValue$) {
  return xs.combine(weightSliderValue$, heightSliderValue$)
    .map(([weight, height]) => {
      const heightMeters = height * 0.01;
      const bmi = Math.round(weight / (heightMeters * heightMeters));
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

function BmiCalculator(sources) {
  const weightProps$ = xs.of({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  });
  const heightProps$ = xs.of({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  });
  const weightSlider = LabeledSlider({DOM: sources.DOM, props$: weightProps$});
  const heightSlider = LabeledSlider({DOM: sources.DOM, props$: heightProps$});
  const bmi$ = model(weightSlider.value, heightSlider.value);
  const vdom$ = view(bmi$, weightSlider.DOM, heightSlider.DOM);
  return {
    DOM: vdom$
  };
}

export default BmiCalculator;
