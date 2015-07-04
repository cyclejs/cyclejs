import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/web';
import {makeHTTPDriver} from '@cycle/http';

function main(responses) {
  const HELLO_URL = 'http://localhost:8080/hello';
  let request$ = Cycle.Rx.Observable.just(HELLO_URL);
  let vtree$ = responses.HTTP
    .filter(res$ => res$.request === HELLO_URL)
    .mergeAll()
    .map(res => res.text) // We expect this to be "Hello World"
    .startWith('Loading...')
    .map(text =>
      h('div.container', [
        h('h1', text)
      ])
    );

  return {
    DOM: vtree$,
    HTTP: request$
  };
}

const drivers = {
  DOM: makeDOMDriver('.js-container'),
  HTTP: makeHTTPDriver()
}

Cycle.run(main, drivers);
