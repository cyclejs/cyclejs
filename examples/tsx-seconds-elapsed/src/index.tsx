import xs, {Stream} from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver, DOMSource, VNode} from '@cycle/dom';
const {html} = require('snabbdom-jsx');

interface Sources {
  DOM: DOMSource;
}

interface Sinks {
  DOM: Stream<VNode>;
}

function main(sources: Sources) {
   const vdom$ = xs.periodic(1000).map(i => i + 1).startWith(0)
     .map(i =>
       <div>Seconds elapsed {i}</div>
     );

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container')
});
