// Http Random User: Basic Example

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

  // -> Stream of HTTP request objects : Stream<Object>
  const getRandomUser$ = sources.DOM.select('.get-random')
    .events('click')
    .map(() => {
      const randomNum = Math.round(Math.random() * 9) + 1;

      // -> plain request object
      return {

        // add 'category' for referencing by the HTTP driver
        category: 'users',

        // use template string to import parameter
        url: `http://jsonplaceholder.typicode.com/users/${randomNum}`,
        method: 'GET',
      };
    });

  // Get users as Stream of HTTP responses 
  // to the requests made with category 'users'
  const user$ = sources.HTTP.select('users')
    .flatten()
    .map(res => res.body as UserData)
    .startWith(null);

  const vtree$ = user$.map(user =>

    // -> view : virtual node
    div('.users', [
      button('.get-random', 'Get random user'),
      user === null 
        ? null 
        : div('.user-details', [

            h1('.user-name', user.name),
            h4('.user-email', user.email),
            a(
              '.user-website', 
              { attrs: { href: user.website } }, 
              user.website
            )

        ])
    ])

  );

  return {
    DOM: vtree$,

    // export stream of pure request objects
    HTTP: getRandomUser$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container'),
  HTTP: makeHTTPDriver()
});
