import {Observable} from 'rxjs';
import {div, span, input} from '@cycle/dom';

function LabeledSlider({DOM, props$}) {
  let initialValue$ = props$.map(props => props.initial).take(1);
  let newValue$ = DOM.select('.slider').events('input').map(ev => ev.target.value);
  let value$ = initialValue$.concat(newValue$);

  let vtree$ = Observable.combineLatest(props$, value$, (props, value) =>
    div('.labeled-slider', [
      span('.label', [ props.label + ' ' + value + props.unit ]),
      input('.slider', {
        attrs: {type: 'range', min: props.min, max: props.max, value: value}
      })
    ])
  );

  return {
    DOM: vtree$,
    value$
  };
}

export default LabeledSlider;
