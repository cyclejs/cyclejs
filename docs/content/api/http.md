# Cycle HTTP - [source](https://github.com/cyclejs/cyclejs/tree/master/http)

A Driver for making HTTP requests, based on [superagent](https://github.com/visionmedia/superagent).

```
npm install @cycle/http
```

## Usage

Create the driver with `makeHTTPDriver()` and provide it under the `HTTP`
key. The app sends request objects to the `HTTP` sink and reads responses from
the `HTTP` source.

```js
import xs from 'xstream';
import {run} from '@cycle/run';
import {button, div, h1, makeDOMDriver} from '@cycle/dom';
import {makeHTTPDriver} from '@cycle/http';

function main(sources) {
  // ...
}

const drivers = {
  DOM: makeDOMDriver('#app'),
  HTTP: makeHTTPDriver(),
};

run(main, drivers);
```

### Basic request and response flow

The HTTP sink can emit either a URL string or a request object. A request object
must have `url`; all other options are passed to Superagent.

```js
function main(sources) {
  const request$ = xs.of({
    url: 'http://localhost:8080/hello', // GET method by default
    category: 'hello',
  });

  const response$ = sources.HTTP
    .select('hello')
    .flatten();

  const vdom$ = response$
    .map(res => res.text)
    .startWith('Loading...')
    .map(text =>
      div('.container', [
        h1(text),
      ])
    );

  return {
    DOM: vdom$,
    HTTP: request$,
  };
}
```

### Request options

These examples cover the most common request shapes:

```js
const getUser$ = xs.of({
  url: '/api/users/42',
  category: 'user',
  query: {include: 'profile'},
  headers: {'X-Client': 'cycle'},
});

const createUser$ = xs.of({
  url: '/api/users',
  method: 'POST',
  category: 'user',
  send: {name: 'Ada'},
  type: 'json',
  accept: 'json',
});

const avatarData = new FormData();
avatarData.append('avatar', fileInput.files[0]);

const uploadAvatar$ = xs.of({
  url: '/api/avatar',
  method: 'POST',
  category: 'avatar',
  send: avatarData,
  progress: true,
});
```

When sending `FormData`, do not set `Content-Type` manually. Superagent will add
the multipart boundary for you.

The request stream returned in the sink is often created from user events:

```js
const searchRequest$ = sources.DOM.select('.search').events('input')
  .map(event => event.target.value)
  .filter(query => query.length >= 3)
  .map(query => ({
    url: 'https://api.github.com/search/repositories',
    category: 'github-search',
    query: {q: query},
  }));
```

### Selecting responses

`sources.HTTP.select(category)` returns a stream of response streams. In Cycle.js
docs, a variable name ending in `$$` means that it is a stream of streams.

Each inner response stream has a `request` field, which is the normalized request
that produced the response. You can use it to inspect metadata or match a
response to its request.

```js
const response$$ = sources.HTTP.select('github-search');

response$$.addListener({
  next: response$ => {
    console.log(response$.request.category); // 'github-search'
    console.log(response$.request.url);
  },
  error: () => {},
  complete: () => {},
});
```

To read the actual Superagent responses, flatten the response metastream:

```js
const response$ = sources.HTTP
  .select('github-search')
  .flatten();

const result$ = response$
  .map(response => response.body.items);
```

`flatten()` uses xstream's normal limited-concurrency behavior: if a new inner
response stream arrives before the previous one completes, the previous request
is cancelled. This is useful for live search where old results should be
ignored.

Use `flattenConcurrently()` when every request should be allowed to finish:

```js
const saveResponse$ = sources.HTTP
  .select('save')
  .flattenConcurrently();
```

When you need custom filtering, use `HTTPSource.filter()` before `select()`:

```js
const writeResponse$ = sources.HTTP
  .filter(request => request.method === 'POST' || request.method === 'PUT')
  .select()
  .flattenConcurrently();
```

### Full example

```js
function main(sources) {
  const request$ = sources.DOM.select('.refresh').events('click')
    .startWith(null)
    .mapTo({
      url: 'https://jsonplaceholder.typicode.com/users/1',
      category: 'user',
      accept: 'json',
    });

  const user$ = sources.HTTP.select('user')
    .flatten()
    .map(response => response.body)
    .startWith(null);

  const vdom$ = user$.map(user =>
    div([
      button('.refresh', 'Refresh'),
      user === null
        ? h1('Loading...')
        : h1(user.name),
    ])
  );

  return {
    DOM: vdom$,
    HTTP: request$,
  };
}
```

## Error handling

Handle errors on each inner response stream. If you only handle errors after
flattening, an HTTP error can end the whole flattened response stream.

```js
const user$ = sources.HTTP
  .select('user')
  .map(response$ =>
    response$
      .map(response => ({type: 'success', body: response.body}))
      .replaceError(error => xs.of({type: 'failure', error}))
  )
  .flatten();
```

For RxJS, use `catchError()` on the inner observable:

```js
const user$ = sources.HTTP
  .select('user')
  .pipe(
    map(response$ =>
      response$.pipe(
        map(response => ({type: 'success', body: response.body})),
        catchError(error => of({type: 'failure', error}))
      )
    ),
    switchAll()
  );
```

For more information, refer to the [xstream documentation for replaceError](https://github.com/staltz/xstream#replaceError) or the [RxJS documentation for catchError](https://rxjs.dev/api/operators/catchError).

## Isolation semantics

Cycle HTTP supports isolation between components using the `@cycle/isolate`
package. Isolation scopes are stored on outgoing requests and are used to filter
incoming response streams.

**When the scope is `null`: no isolation.**

The child component runs in the same HTTP context as its parent, so calls such as
`HTTPSource.select()` can see response streams from the parent and siblings.

**When the scope is a string: sibling isolation.**

The parent can still see HTTP responses from its children, but an isolated child
cannot see responses from siblings isolated with other scopes.

```js
import isolate from '@cycle/isolate';

function UserCard(sources) {
  const request$ = xs.of({
    url: '/api/users/42',
    category: 'user',
  });

  const name$ = sources.HTTP.select('user')
    .flatten()
    .map(response => response.body.name)
    .startWith('Loading...');

  return {
    DOM: name$.map(name => div(name)),
    HTTP: request$,
  };
}

const IsolatedUserCard = isolate(UserCard, {HTTP: 'user-card-42'});
```

For multiple instances of the same component, give each instance a distinct HTTP
scope so their requests and responses do not collide.

```js
const FirstUser = isolate(UserCard, {HTTP: 'user-1'});
const SecondUser = isolate(UserCard, {HTTP: 'user-2'});
```

## More information

For a more advanced usage, check the [Search example](https://github.com/cyclejs/cyclejs/tree/master/examples/http-search-github).

## Browser support

[![Sauce Test Status](https://saucelabs.com/browser-matrix/cyclejs-http.svg)](https://saucelabs.com/u/cyclejs-http)

IE 8 is not supported because this library depends on [superagent](https://github.com/visionmedia/superagent), which knowingly doesn't support IE 8.

# API
