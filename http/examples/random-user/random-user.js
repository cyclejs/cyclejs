import Cycle from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/web';
import {makeHTTPDriver} from '@cycle/http';

function main(responses) {
  const USERS_URL = 'http://jsonplaceholder.typicode.com/users/';
  let getRandomUser$ = responses.DOM.get('.get-random-user', 'click')
    .map(() => {
      let randomNum = Math.round(Math.random()*9)+1; // from 1 to 10
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
  
  return {
    DOM: user$.map(user =>
      h('div.users', [
        h('button.get-random-user', 'Get random user'),
        user === null ? h('h1.user-name', 'Loading...') :
          h('h1.user-name', user.name)
      ])
    ),
    HTTP: getRandomUser$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver()
});
