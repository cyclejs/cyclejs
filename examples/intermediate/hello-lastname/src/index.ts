// Hello Last name : Intermediate Example

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

  const firstName$ = sources.DOM.select('.first')
    .events('input')
    .map(ev => (ev.target as HTMLInputElement).value)
    .startWith('');

  const lastName$ = sources.DOM.select('.last')
    .events('input')
    .map(ev => (ev.target as HTMLInputElement).value)
    .map(ln => ln.toUpperCase())
    .startWith('');


  // -> Stream of pairs [firstName, lastName] :
  // Stream<Array<String>>
  const rawFullName$ = xs.combine(firstName$, lastName$)
    .remember();


  const validName$ = rawFullName$

    // we want firstName longer than 0 and lastName longer than 2
    .filter(([fn, ln]) => fn.length > 0 && ln.length >= 3)

    // -> Stream<String>
    .map(([fn, ln]) => `${ln.toUpperCase()}, ${fn}`);


  const invalidName$ = rawFullName$
    .filter(([fn, ln]) => fn.length === 0 || ln.length < 3)

    // log only invalid names
    .map(pair => {
      const [fn, ln] = pair
      console.log(fn.length, ln.length) 

      // === Don't forget to return back to the Stream! ===
      return pair
    })

    // replace with empty strings for invalid names
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

      h2(`Hello ${name}`)

    ])
  );

  return {
    DOM: vdom$,
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
