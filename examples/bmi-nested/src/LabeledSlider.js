import xs from 'xstream';
import {div, span, input} from '@cycle/dom';

function LabeledSlider({DOM, props$}) {
  let initialValue$ = props$.map(props => props.initial).take(1);
  let newValue$ = DOM.select('.slider').events('input').map(ev => ev.target.value);
  let value$ = initialValue$.merge(newValue$).remember();

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
