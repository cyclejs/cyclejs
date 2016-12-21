// Bmi Naive : Basic Example

import Cycle from '@cycle/rxjs-run';
import {Observable} from 'rxjs';
import {div, input, h2, makeDOMDriver} from '@cycle/dom';


function main(sources) {

  // -> Stream<Number>
  let changeWeight$ = sources.DOM.select('#weight')
    .events('input')
    .map(ev => ev.target.value);

  // -> Stream<Number>
  let changeHeight$ = sources.DOM.select('#height')
    .events('input')
    .map(ev => ev.target.value);


  // http://reactivex.io/documentation/operators/combinelatest.html
  // 
  // Combine into single stream via the function provided
  // -> Stream<Object>
  let state$ = Observable.combineLatest(

    changeWeight$.startWith(70),
    changeHeight$.startWith(170),

    // function applied to both stream values
    (weight, height) => {
      let heightMeters = height * 0.01;
      let bmi = Math.round(weight / (heightMeters * heightMeters));
      return {weight, height, bmi};
    }

  );

  return {
    DOM: state$.map( ({weight, height, bmi}) =>

      div([

        // use template strings to embed params
        div([
          `Weight ${weight} kg`,
          input('#weight', {
            attrs: {type: 'range', min: 40, max: 140, value: weight}
          })
        ]),

        div([
          `Height ${height} cm`,
          input('#height', {
            attrs: {type: 'range', min: 140, max: 210, value: height}
          })
        ]),

        h2(`BMI is ${bmi}`)

      ])

    )
  };
}

Cycle.run(main, {
  // DOM: makeDOMDriver('#main-container')
  DOM: makeDOMDriver(document.body)
});
