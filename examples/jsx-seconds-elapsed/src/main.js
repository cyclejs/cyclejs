import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';
import {html} from 'snabbdom-jsx';

function main(sources) {
  const vdom$ = xs.periodic(1000).map(i => i + 1).startWith(0)
    .map(i =>
      <div>Seconds elapsed {i}</div>
    );

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container'),
});
