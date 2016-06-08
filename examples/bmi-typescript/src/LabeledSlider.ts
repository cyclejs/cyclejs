import xs, {Stream, MemoryStream} from 'xstream';
import {div, span, input, VNode} from '@cycle/dom';
import {DOMSource} from '@cycle/dom/xstream-typings.d.ts';

export interface LabeledSliderProps {
  label: string;
  unit: string;
  min: number;
  initial: number;
  max: number;
}

export type Sources = {
  DOM: DOMSource,
  props$: Stream<LabeledSliderProps>,
}
export type Sinks = {
  DOM: Stream<VNode>,
  value$: MemoryStream<number>,
}

function LabeledSlider(sources: Sources): Sinks {
  let props$: Stream<LabeledSliderProps> = sources.props$;
  let initialValue$ = props$.map(props => props.initial).take(1);
  let el$ = sources.DOM.select('.slider').elements();
  let newValue$ = sources.DOM.select('.slider').events('input')
    .map(ev => parseInt((<HTMLInputElement> ev.target).value));
  let value$ = xs.merge(initialValue$, newValue$).remember();

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
