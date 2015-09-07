import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(responses) {
  const USERS_URL = 'http://jsonplaceholder.typicode.com/users/';
  let getRandomUser$ = responses.DOM.select('.get-random').events('click')
    .map(() => {
      let randomNum = Math.round(Math.random() * 9) + 1;
      return {
        url: USERS_URL + String(randomNum),
        method: 'GET'
      };
    });

  let user$ = responses.HTTP
    .filter(res$ => res$.request.url.indexOf(USERS_URL) === 0)
    .mergeAll()
    .map(res => res.body)
    .startWith(null);

  let vtree$ = user$.map(user =>
    h('div.users', [
      h('button.get-random', 'Get random user'),
      user === null ? null : h('div.user-details', [
        h('h1.user-name', user.name),
        h('h4.user-email', user.email),
        h('a.user-website', {href: user.website}, user.website)
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
