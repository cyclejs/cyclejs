import xs, {Stream} from 'xstream';
import Cycle from '@cycle/xstream-run';
import {div, input, h2, button, p, makeDOMDriver, VNode} from '@cycle/dom';
import {DOMSource} from '@cycle/dom/xstream-typings';

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
    .filter(([fn, ln]) => {
      console.log(fn.length, ln.length);
      return fn.length === 0 || ln.length < 3
    })
    .mapTo('');

  const name$ = xs.merge(validName$, invalidName$);

  const vdom$ = name$.map(name =>
    div([
      p([
        'First name',
        input('.first', { attrs: { type: 'text' } })
      ]),
      p([
        'Last name',
        input('.last', { attrs: { type: 'text' } })
      ]),
      h2('Hello ' + name)
    ])
  );

  return {
    DOM: vdom$,
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
