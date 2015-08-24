import {Rx} from '@cycle/core';
import {h} from '@cycle/dom';

function labeledSlider({DOM, props$}, name = '') {
  let initialValue$ = props$.map(props => props.initial).first();
  let newValue$ = DOM.get(`.labeled-slider${name} .slider`, 'input')
    .map(ev => ev.target.value);
  let value$ = initialValue$.concat(newValue$);
  let vtree$ = Rx.Observable.combineLatest(props$, value$, (props, value) =>
    h(`div.labeled-slider${name}`, [
      h('span.label', [
        props.label + ' ' + value + props.unit
      ]),
      h('input.slider', {
        type: 'range',
        min: props.min,
        max: props.max,
        value: value
      })
    ])
  );

  return {
    DOM: vtree$,
    value$
  };
}

export default labeledSlider;
