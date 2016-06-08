import Cycle from '@cycle/xstream-run';
import {Stream} from 'xstream';
import {div, button, h1, h4, a, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver, Response} from '@cycle/http';
import {DOMSource} from '@cycle/dom/xstream-typings';
import {HTTPSource} from '@cycle/http/xstream-typings';

interface UserData {
  id: number,
  name: string,
  username: string,
  email: string,
  address: {
    street: string,
    suite: string,
    city: string,
    zipcode: string,
    geo: {
      lat: string,
      lng: string,
    }
  },
  phone: string,
  website: string,
  company: {
    name: string,
    catchPhrase: string,
    bs: string,
  }
}

function main(sources: {DOM: DOMSource, HTTP: HTTPSource}) {
  const getRandomUser$ = sources.DOM.select('.get-random').events('click')
    .map(() => {
      const randomNum = Math.round(Math.random() * 9) + 1;
      return {
        url: 'http://jsonplaceholder.typicode.com/users/' + String(randomNum),
        category: 'users',
        method: 'GET'
      };
    });

  const user$ = sources.HTTP.select('users')
    .flatten()
    .map(res => res.body)
    .startWith(null)
    .compose(s => <Stream<UserData>> s);

  const vtree$ = user$.map(user =>
    div('.users', [
      button('.get-random', 'Get random user'),
      user === null ? null : div('.user-details', [
        h1('.user-name', user.name),
        h4('.user-email', user.email),
        a('.user-website', {attrs: {href: user.website}}, user.website)
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
