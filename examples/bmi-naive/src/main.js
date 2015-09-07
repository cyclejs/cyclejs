import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';

function main({DOM}) {
  let changeWeight$ = DOM.select('#weight').events('input')
    .map(ev => ev.target.value);
  let changeHeight$ = DOM.select('#height').events('input')
    .map(ev => ev.target.value);
  let state$ = Cycle.Rx.Observable.combineLatest(
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
      h('div', [
        h('div', [
          'Weight ' + weight + 'kg',
          h('input#weight', {type: 'range', min: 40, max: 140, value: weight})
        ]),
        h('div', [
          'Height ' + height + 'cm',
          h('input#height', {type: 'range', min: 140, max: 210, value: height})
        ]),
        h('h2', 'BMI is ' + bmi)
      ])
    )
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
