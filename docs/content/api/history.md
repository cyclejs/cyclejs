# Cycle History - [source](https://github.com/cyclejs/cyclejs/tree/master/history)

This is the standard Cycle.js driver for dealing with the History API.

This project is 100% compatible with mjackson/history, most notably used to create React-Router. This allows for a Cycle.js application to be embedded inside of an existing React application and share history instances.

Though this library makes use of the interface that the mjackson/history library provides, any other library can be used which satisfies the interface. Also take note of the ServerHistory object we have made to easily allow for server-side rendering of your Cycle application.

```
npm install @cycle/history
```

## Basic routing

The history driver receives navigation requests from your app and emits the
current location. The source emits the initial location first, then emits again
whenever the driver pushes, replaces, or moves through history.

```js
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver, div, nav, a, h1, p} from '@cycle/dom';
import {makeHistoryDriver} from '@cycle/history';

function page(pathname) {
  if (pathname === '/about') {
    return div([h1('About'), p('About this app')]);
  }

  if (pathname === '/') {
    return div([h1('Home'), p('Welcome')]);
  }

  return div([h1('Not found')]);
}

function main(sources) {
  const vdom$ = sources.history.map(location =>
    div([
      nav([
        a({attrs: {href: '/'}}, 'Home'),
        a({attrs: {href: '/about'}}, 'About'),
      ]),
      page(location.pathname),
    ])
  );

  return {
    DOM: vdom$,
    history: xs.never(),
  };
}

run(main, {
  DOM: makeDOMDriver('#app'),
  history: makeHistoryDriver(),
});
```

The history sink accepts strings as a shorthand for pushing a pathname. It also
accepts objects when you need a specific operation:

```js
const goToAbout$ = xs.of('/about');
const replaceWithHome$ = xs.of({type: 'replace', pathname: '/'});
const goBack$ = xs.of({type: 'goBack'});

return {
  history: xs.merge(goToAbout$, replaceWithHome$, goBack$),
};
```

Use `makeHashHistoryDriver()` when your deployment environment cannot serve
all routes from the same HTML entry point. Use `makeServerHistoryDriver()` in
tests and server-side rendering, where a browser history object is not
available.

## Capturing link clicks

If your app renders ordinary internal links, wrap the browser history driver
with `captureClicks()`. This prevents same-origin anchor clicks from causing a
full page reload and pushes the clicked path through the history driver
instead.

```js
import {captureClicks, makeHistoryDriver} from '@cycle/history';

const drivers = {
  history: captureClicks(makeHistoryDriver()),
};
```

`captureClicks()` only handles normal primary-button clicks on same-origin
links. It leaves modified clicks, links with `target`, downloads, hash links,
`mailto:` links, and external links to the browser.

When you need custom behavior, such as analytics before navigation or a
confirmation dialog, handle DOM events yourself and emit the desired history
input from your app:

```js
function main(sources) {
  const navigation$ = sources.DOM.select('a[data-route]')
    .events('click', {preventDefault: true})
    .map(event => event.currentTarget.getAttribute('href'));

  return {
    history: navigation$,
  };
}
```

## Active links

Because the history source is a stream of locations, active navigation state is
usually derived from `location.pathname`.

```js
function link(pathname, currentPathname, label) {
  return a(
    {
      attrs: {href: pathname},
      class: {active: pathname === currentPathname},
    },
    label
  );
}

function navigation(location) {
  return nav([
    link('/', location.pathname, 'Home'),
    link('/about', location.pathname, 'About'),
  ]);
}
```

## Testing with memory history

Use `makeServerHistoryDriver()` for tests. It uses memory history and emits the
initial location, so tests that assert navigation should skip that first
emission if they only care about changes caused by the app.

```js
import xs from 'xstream';
import {setup} from '@cycle/run';
import {makeServerHistoryDriver} from '@cycle/history';

function main() {
  return {
    history: xs.of('/settings'),
  };
}

const {sources, run} = setup(main, {
  history: makeServerHistoryDriver({initialEntries: ['/']}),
});

sources.history.drop(1).addListener({
  next(location) {
    console.log(location.pathname); // '/settings'
  },
});

run();
```

# API
