import Cycle from '@cycle/core';
import {div, button, h1, h4, a, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {
  const getRandomUser$ = sources.DOM.select('.get-random').events('click')
    .map(() => {
      const randomNum = Math.round(Math.random() * 9) + 1;
      return {
        url: 'http://jsonplaceholder.typicode.com/users/' + String(randomNum),
        key: 'users',
        method: 'GET'
      };
    });

  const user$ = sources.HTTP
    .filter(res$ => res$.request.key === 'users')
    .mergeAll()
    .map(res => res.body)
    .startWith(null);

  const vtree$ = user$.map(user =>
    div('.users', [
      button('.get-random', 'Get random user'),
      user === null ? null : div('.user-details', [
        h1('.user-name', user.name),
        h4('.user-email', user.email),
        a('.user-website', {href: user.website}, user.website)
      ])
    ])
  );

  return {
    DOM: vtree$,
    HTTP: getRandomUser$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});
