import xs from 'xstream';
import {div, span, input} from '@cycle/dom';

function LabeledSlider({DOM, props$}) {
  let initialValue$ = props$.map(props => props.initial).take(1);
  let newValue$ = DOM.select('.slider').events('input').map(ev => ev.target.value);
  let value$ = xs.merge(initialValue$, newValue$).remember();

  let vtree$ = xs.combine(props$, value$).map(([props, value]) =>
    div('.labeled-slider', [
      span('.label', [ props.label + ' ' + value + props.unit ]),
      input('.slider', {
        attrs: {type: 'range', min: props.min, max: props.max, value: value}
      })
    ])
  );

  return {
    DOM: vtree$,
    value$: value$,
  };
}

export default LabeledSlider;
