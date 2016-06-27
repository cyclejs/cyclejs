import Cycle from '@cycle/rxjs-run';
import {Observable} from 'rxjs';
import {div, input, h2, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  let changeWeight$ = sources.DOM.select('#weight').events('input')
    .map(ev => ev.target.value);
  let changeHeight$ = sources.DOM.select('#height').events('input')
    .map(ev => ev.target.value);

  let state$ = Observable.combineLatest(
    changeWeight$.startWith(70),
    changeHeight$.startWith(170),
    (weight, height) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return {weight, height, bmi};
    }
  );

  return {
    DOM: state$.map(({weight, height, bmi}) =>
      div([
        div([
          'Weight ' + weight + 'kg',
          input('#weight', {
            attrs: {type: 'range', min: 40, max: 140, value: weight}
          })
        ]),
        div([
          'Height ' + height + 'cm',
          input('#height', {
            attrs: {type: 'range', min: 140, max: 210, value: height}
          })
        ]),
        h2('BMI is ' + bmi)
      ])
    )
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
