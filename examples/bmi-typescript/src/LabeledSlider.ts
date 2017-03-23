import xs, {Stream, MemoryStream} from 'xstream';
import {div, span, input, VNode, DOMSource} from '@cycle/dom';

export type LabeledSliderProps = {
  label: string;
  unit: string;
  min: number;
  initial: number;
  max: number;
};

export type Sources = {
  DOM: DOMSource,
  props$: Stream<LabeledSliderProps>,
};

export type Sinks = {
  DOM: Stream<VNode>,
  value$: MemoryStream<number>,
};

function LabeledSlider(sources: Sources): Sinks {
  const props$: Stream<LabeledSliderProps> = sources.props$;
  const initialValue$ = props$.map(props => props.initial).take(1);
  const newValue$ = sources.DOM.select('.slider').events('input')
    .map(ev => parseInt((ev.target as HTMLInputElement).value));
  const value$ = xs.merge(initialValue$, newValue$).remember();

  const vdom$ = xs.combine(props$, value$)
    .map(([props, value]) =>
      div('.labeled-slider', [
        span('.label', [ props.label + ' ' + value + props.unit ]),
        input('.slider', {
          attrs: {type: 'range', min: props.min, max: props.max, value: value}
        }),
      ]),
    );

  return {
    DOM: vdom$,
    value$: value$,
  };
}

export default LabeledSlider;
