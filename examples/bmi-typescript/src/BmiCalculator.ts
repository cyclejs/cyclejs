import xs, {Stream, MemoryStream} from 'xstream';
import {h2, div, VNode, DOMSource} from '@cycle/dom';
import isolate from '@cycle/isolate';
import LabeledSlider, {LabeledSliderProps} from './LabeledSlider';

export type Sources = {
  DOM: DOMSource,
};
export type Sinks = {
  DOM: Stream<VNode>,
};

function BmiCalculator(sources: Sources): Sinks {
  const WeightSlider = isolate(LabeledSlider) as typeof LabeledSlider;
  const HeightSlider = isolate(LabeledSlider) as typeof LabeledSlider;

  const weightProps$ = xs.of({
    label: 'Weight', unit: 'kg', min: 40, initial: 70, max: 140,
  }).remember();
  const heightProps$ = xs.of({
    label: 'Height', unit: 'cm', min: 140, initial: 170, max: 210,
  }).remember();

  const weightSlider = WeightSlider({DOM: sources.DOM, props$: weightProps$});
  const heightSlider = HeightSlider({DOM: sources.DOM, props$: heightProps$});

  const bmi$ = xs.combine(weightSlider.value$, heightSlider.value$)
    .map(([weight, height]) => {
      const heightMeters = height * 0.01;
      const bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    }).remember();

  const vdom$ = xs.combine(bmi$, weightSlider.DOM, heightSlider.DOM)
    .map(([bmi, weightVTree, heightVTree]) =>
      div([
        weightVTree,
        heightVTree,
        h2('BMI is ' + bmi),
      ]),
    );

  return {
    DOM: vdom$,
  };
}

export default BmiCalculator;
