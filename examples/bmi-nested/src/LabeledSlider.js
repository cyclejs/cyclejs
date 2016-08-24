import xs from 'xstream';
import {div, span, input} from '@cycle/dom';
import isolate from '@cycle/isolate';

function intent(DOMSource) {
  return DOMSource.select('.slider').events('input').map(ev => ev.target.value);
};

function model(newValue$, props$) {
  let initialValue$ = props$.map((props) => props.initial).take(1);
  return xs.merge(initialValue$, newValue$).remember();
};

function view(props$, value$) {
  return xs.combine(props$, value$).map(([props, value]) =>
    div('.labeled-slider', [
      span('.label', `${props.label} ${value}${props.unit}`),
      input('.slider', {
        attrs: {type: 'range', min: props.min, max: props.max, value}
      })
    ])
  );
};

let LabeledSlider = function(sources) {
  let change$ = intent(sources.DOM);
  let value$ = model(change$, sources.props$);
  let vtree$ = view(sources.props$, value$);
  return {
    DOM: vtree$,
    value: value$
  };
};

let IsolatedLabeledSlider = function (sources) {
  return isolate(LabeledSlider)(sources);
};

export default IsolatedLabeledSlider;
