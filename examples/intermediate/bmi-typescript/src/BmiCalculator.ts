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


function BmiCalculator({DOM}: Sources): Sinks {

  // https://github.com/cyclejs/cyclejs/tree/master/isolate
  // 
  // Create two isolated copies of LabeledSlider component
  let WeightSlider = isolate(LabeledSlider);
  let HeightSlider = isolate(LabeledSlider);

  // immediately emitting stream with single object
  let weightProps$ = xs.of<LabeledSliderProps>({
    label: 'Weight', 
    unit: 'kg', 
    min: 40, 
    initial: 70, 
    max: 140
  })
  .remember();

  let heightProps$ = xs.of<LabeledSliderProps>({
    label: 'Height', 
    unit: 'cm', 
    min: 140, 
    initial: 170, 
    max: 210
  })
  .remember();

  // instantiante components
  let weightSlider = WeightSlider({
    DOM, 
    props$: weightProps$
  });

  let heightSlider = HeightSlider({
    DOM, 
    props$: heightProps$
  });

  let bmi$ = xs.combine(weightSlider.value$, heightSlider.value$)
    .map(([weight, height]) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return bmi;
    })
    .remember();

  return {

    // get Stream<vNode> from component instances
    DOM: xs.combine(bmi$, weightSlider.DOM, heightSlider.DOM)
      .map(([bmi, weightVTree, heightVTree]) =>

        div([

          // drop virtual DOM trees as children of 'div'
          weightVTree,
          heightVTree,
          h2(`BMI is ${bmi}`)
        ])

      )
  };
}

export default BmiCalculator;
