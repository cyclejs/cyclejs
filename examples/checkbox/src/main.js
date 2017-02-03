import {run} from '@cycle/run';
import {div, input, p, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const vdom$ = sources.DOM
    .select('input').events('change')
    .map(ev => ev.target.checked)
    .startWith(false)
    .map(toggled =>
      div([
        input({attrs: {type: 'checkbox'}}), 'Toggle me',
        p(toggled ? 'ON' : 'off')
      ])
    );

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container')
});
