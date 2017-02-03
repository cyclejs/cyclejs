import xs, {Stream} from 'xstream';
import {run} from '@cycle/run';
import {div, input, h2, button, p, makeDOMDriver, VNode, DOMSource} from '@cycle/dom';

interface Sources {
  DOM: DOMSource;
}

interface Sinks {
  DOM: Stream<VNode>;
}

function main(sources: Sources): Sinks {
  const firstName$ = sources.DOM
    .select('.first')
    .events('input')
    .map(ev => (ev.target as HTMLInputElement).value)
    .startWith('');

  const lastName$ = sources.DOM
    .select('.last')
    .events('input')
    .map(ev => (ev.target as HTMLInputElement).value)
    .map(ln => ln.toUpperCase())
    .startWith('');

  const rawFullName$ = xs.combine(firstName$, lastName$)
    .remember();

  const validName$ = rawFullName$
    .filter(([fn, ln]) => fn.length > 0 && ln.length >= 3)
    .map(([fn, ln]) => `${ln.toUpperCase()}, ${fn}`);

  const invalidName$ = rawFullName$
    .filter(([fn, ln]) => fn.length === 0 || ln.length < 3)
    .mapTo('');

  const name$ = xs.merge(validName$, invalidName$);

  const vdom$ = name$.map(name =>
    div([
      p([
        'First name',
        input('.first', { attrs: { type: 'text' } }),
      ]),
      p([
        'Last name',
        input('.last', { attrs: { type: 'text' } }),
      ]),
      h2('Hello ' + name),
    ]),
  );

  return {
    DOM: vdom$,
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container'),
});
