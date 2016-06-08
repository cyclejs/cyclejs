import xs, {Stream, MemoryStream} from 'xstream';
import {h2, div, VNode} from '@cycle/dom';
import {DOMSource} from '@cycle/dom/xstream-typings';
import isolate from '@cycle/isolate';
import LabeledSlider, {LabeledSliderProps} from './LabeledSlider';

export type Sources = {
  DOM: DOMSource,
};
export type Sinks = {
  DOM: Stream<VNode>,
}

function BmiCalculator(sources: Sources): Sinks {
  let WeightSlider = isolate(LabeledSlider);
  let HeightSlider = isolate(LabeledSlider);

  let weightProps$ = xs.of<LabeledSliderProps>({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140
  }).remember();
  let heightProps$ = xs.of<LabeledSliderProps>({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210
  }).remember();

  let weightSlider = WeightSlider({DOM: sources.DOM, props$: weightProps$});
  let heightSlider = HeightSlider({DOM: sources.DOM, props$: heightProps$});

  let bmi$ = xs.combine(
    (weight, height) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    },
    weightSlider.value$, heightSlider.value$
  ).remember();

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
