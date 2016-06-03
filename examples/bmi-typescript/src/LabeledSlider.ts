import xs, {Stream} from 'xstream';
import {div, span, input, VNode, DOMSource} from '@cycle/dom';

export interface LabeledSliderProps {
  label: string;
  unit: string;
  min: number;
  initial: number;
  max: number;
}

export interface LabeledSliderSources {
  props$: Stream<LabeledSliderProps>;
  DOM: DOMSource;
}

function LabeledSlider(sources: LabeledSliderSources) {
  let props$: Stream<LabeledSliderProps> = sources.props$;
  let initialValue$ = props$.map(props => props.initial).take(1);
  let newValue$ = sources.DOM.select('.slider').events('input')
    .map((ev: Event) => (<HTMLInputElement> ev.target).value);
  let value$: Stream<number> = xs.merge(initialValue$, newValue$).remember();

  let vtree$ = xs.combine(
    (props, value) =>
      div('.labeled-slider', [
        span('.label', [ props.label + ' ' + value + props.unit ]),
        input('.slider', {
          attrs: {type: 'range', min: props.min, max: props.max, value: value}
        })
      ]),
    props$, value$
  );

  return {
    DOM: vtree$,
    value$: value$,
  };
}

export default LabeledSlider;
