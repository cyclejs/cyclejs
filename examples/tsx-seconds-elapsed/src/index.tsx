import xs, {Stream} from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver, DOMSource, VNode} from '@cycle/dom';
const {html} = require('snabbdom-jsx');

type Sources = {
  DOM: DOMSource;
};

type Sinks = {
  DOM: Stream<JSX.Element>;
};

function main(sources: Sources): Sinks {
   const vdom$ = xs.periodic(1000).map(i => i + 1).startWith(0)
     .map(i => <div>Seconds elapsed {i}</div>);

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container'),
});
