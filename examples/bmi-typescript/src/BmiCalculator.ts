import xs from 'xstream';
import {h2, div, VNode, DOMSource} from '@cycle/dom';
import isolate from '@cycle/isolate';
import LabeledSlider, {LabeledSliderProps} from './LabeledSlider';

function BmiCalculator(sources: {DOM: DOMSource}) {
  let WeightSlider = isolate(LabeledSlider);
  let HeightSlider = isolate(LabeledSlider);

  let weightProps$ = xs.of<LabeledSliderProps>({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  });
  let heightProps$ = xs.of<LabeledSliderProps>({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  });

  let weightSlider = WeightSlider({DOM: sources.DOM, props$: weightProps$});
  let heightSlider = HeightSlider({DOM: sources.DOM, props$: heightProps$});

  let bmi$ = xs.combine(
    (weight, height) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    },
    weightSlider.value$, heightSlider.value$
  );

  return {
    DOM: bmi$.combine(
      (bmi, weightVTree, heightVTree) =>
        div([
          weightVTree,
          heightVTree,
          h2('BMI is ' + bmi)
        ]),
      weightSlider.DOM, heightSlider.DOM
    )
  };
}

export default BmiCalculator;
