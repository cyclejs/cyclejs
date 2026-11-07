import xs, {Stream} from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver, DOMSource, VNode} from '@cycle/dom';
import {timeDriver, TimeSource} from '@cycle/time';
const {html} = require('snabbdom-jsx');

type Sources = {
  DOM: DOMSource;
  Time: TimeSource;
};

type Sinks = {
  DOM: Stream<JSX.Element>;
};

function main(sources: Sources): Sinks {
  // The typed Time source owns scheduling; main only maps ticks to a TSX view.
  const vdom$ = sources.Time.periodic(1000).map(i => i + 1).startWith(0)
    .map(i => <div>Seconds elapsed {i}</div>);

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container'),
  Time: timeDriver
});
