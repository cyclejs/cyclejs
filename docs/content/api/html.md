# Cycle HTML - [source](https://github.com/cyclejs/cyclejs/tree/master/html)

A Cycle.js driver to render virtual DOM streams as HTML. This is based on the DOM driver and [snabbdom](https://github.com/paldepind/snabbdom/), and is intended for server-side rendered HTML that mirrors what the DOM driver would render client-side.

```
npm install @cycle/html @cycle/dom
```

## Usage

Use `makeHTMLDriver()` on the server when you want to render the same virtual
DOM stream that would normally be sent to `@cycle/dom`, but output it as an
HTML string instead.

```js
import xs from 'xstream';
import {run} from '@cycle/run';
import {body, div, h1, html} from '@cycle/dom';
import {makeHTMLDriver} from '@cycle/html';

function main() {
  return {
    DOM: xs.of(
      html([
        body([
          div('.app', [
            h1('Hello from Cycle.js'),
          ]),
        ]),
      ])
    ),
  };
}

function render(response) {
  run(main, {
    DOM: makeHTMLDriver(markup => {
      response.send(`<!doctype html>${markup}`);
    }),
  });
}
```

The callback passed to `makeHTMLDriver()` is the side effect that receives each
rendered HTML string. In an HTTP server this is usually where you write to the
response object.

The HTML driver returns a source compatible with the DOM source API so server
and browser applications can share component code. Because there is no browser
DOM on the server, calls such as `sources.DOM.select('.button').events('click')`
return empty streams.

# API
