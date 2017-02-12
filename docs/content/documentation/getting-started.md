## Using create-cycle-app

The quickest way to create a new project with Cycle.js is by using [create-cycle-app](https://github.com/cyclejs-community/create-cycle-app).

```bash
npm install --global create-cycle-app
create-cycle-app my-awesome-app
```

This will create a project called *my-awesome-app* (or the name you choose) with Cycle *Run* and Cycle *DOM*.

## npm

If you want to have more control over your project, the recommended channel for downloading Cycle.js as a package is through [npm](http://npmjs.org/). Create a new directory and run this inside that directory:

```bash
npm install xstream @cycle/xstream-run @cycle/dom
```

This installs [xstream](http://staltz.com/xstream), Cycle *Run* using *xstream*, and Cycle *DOM*. Packages *xstream* and *Run* are the minimum required API to work with Cycle.js. The *Run* package includes a single function `run()`, and Cycle *DOM* is the standard DOM Driver providing a way to interface with the DOM. You can also use Cycle.js with other stream libraries like RxJS. Your options are:

- `npm install xstream @cycle/xstream-run` (recommended if you don't know what to choose)
- `npm install rx @cycle/rx-run` (for [RxJS v4](https://github.com/Reactive-Extensions/RxJS))
- `npm install rxjs @cycle/rxjs-run` (for [RxJS v5+](http://reactivex.io/rxjs))
- `npm install most @cycle/most-run` (for cujo.js [most.js](https://github.com/cujojs/most))

Packages of the type `@org/package` are [npm scoped packages](https://docs.npmjs.com/getting-started/scoped-packages), supported if your npm installation is version 2.11 or higher. Check your npm version with `npm --version` and upgrade in order to install Cycle.js.

In case you are not dealing with a DOM-interfacing web application, you can omit `@cycle/dom` when installing.

## First steps

We recommend the use of a bundling tool such as [browserify](http://browserify.org/) or [webpack](http://webpack.github.io/), in combination with ES6 (a.k.a. ES2015) through a transpiler (e.g. [Babel](http://babeljs.io/) or [TypeScript](http://typescriptlang.org/)). Most of the code examples in this documentation assume some basic familiarity with ES6. Once your build system is set up, **write your main JavaScript source file like**:

The second line imports the function `run(main, drivers)`, where `main` is the entry point for our whole application, and `drivers` is a record of driver functions labeled by some name.

```javascript
import xs from 'xstream';
import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';

// ...
```

**Create the `main` function and the `drivers` record:**

`makeDOMDriver(container)` from Cycle *DOM* returns a driver function to interact with the DOM. This function is registered under the key `DOM` in the `drivers` object above.

```javascript
import xs from 'xstream';
import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';

function main() {
  // ...
}

const drivers = {
  DOM: makeDOMDriver('#app')
};

run(main, drivers);
```

**Send messages from `main` to the `DOM` driver:**

We have filled the `main()` function with some code: returns an object `sinks` which has an `xstream` stream defined under the name `DOM`. This indicates `main()` is sending the stream as messages to the DOM driver. Sinks are outgoing messages. The stream emits Virtual DOM `<h1>` elements displaying `${i} seconds elapsed` changing over time every second, where `${i}` is replaced by `0`, `1`, `2`, etc.

```javascript
import xs from 'xstream';
import {run} from '@cycle/xstream-run';
import {makeDOMDriver, h1} from '@cycle/dom';

function main() {
  const sinks = {
    DOM: xs.periodic(1000).map(i =>
      h1('' + i + ' seconds elapsed')
    )
  };
  return sinks;
}

const drivers = {
  DOM: makeDOMDriver('#app')
};

run(main, drivers);
```

**Catch messages from `DOM` into `main` and vice-versa:**

Function `main()` now takes `sources` as input. Just like the output `sinks`, the input `sources` follow the same structure: an object containing `DOM` as a property. `sources.DOM` is an object with a queryable API to get streams. Use `sources.DOM.select(selector).events(eventType)` to get a stream of `eventType` DOM events happening on the element(s) specified by `selector`. This `main()` function takes the stream of clicks happening on `input` elements, and maps those toggling events to Virtual DOM elements displaying a togglable checkbox.

```javascript
import xs from 'xstream';
import {run} from '@cycle/xstream-run';
import {makeDOMDriver, div, input, p} from '@cycle/dom';

function main(sources) {
  const sinks = {
    DOM: sources.DOM.select('input').events('click')
      .map(ev => ev.target.checked)
      .startWith(false)
      .map(toggled =>
        div([
          input({attrs: {type: 'checkbox'}}), 'Toggle me',
          p(toggled ? 'ON' : 'off')
        ])
      )
  };
  return sinks;
}

const drivers = {
  DOM: makeDOMDriver('#app')
};

run(main, drivers);
```

We used the `div()`, `input()`, `p()` helper functions to create virtual DOM elements for the respective `<div>`, `<input>`, `<p>` DOM elements, but you can also use JSX with Babel. The following only works if you are building with Babel: (1) install the npm packages  [babel-plugin-transform-react-jsx](http://babeljs.io/docs/plugins/transform-react-jsx/) and [snabbdom-jsx](https://www.npmjs.com/package/snabbdom-jsx); (2) specify a pragma for JSX as shown in the following example `.babelrc` file:

```json
{
  "presets": [
    "es2015"
  ],
  "plugins": [
    "syntax-jsx",
    ["transform-react-jsx", {"pragma": "html"}]
  ]
}
```

(3) import Snabbdom JSX as `import {html} from 'snabbdom-jsx';`, and then you can utilize JSX:

```javascript
import xs from 'xstream';
import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';
import {html} from 'snabbdom-jsx';

function main(sources) {
  const sinks = {
    DOM: sources.DOM.select('input').events('click')
      .map(ev => ev.target.checked)
      .startWith(false)
      .map(toggled =>
        <div>
          <input type="checkbox" /> Toggle me
          <p>{toggled ? 'ON' : 'off'}</p>
        </div>
      )
  };
  return sinks;
}

const drivers = {
  DOM: makeDOMDriver('#app')
};

run(main, drivers);
```

This example portrays the most common problem-solving pattern in Cycle.js: formulate the computer's behavior as a function of streams: continuously listen to source messages from drivers and continuously provide sinks messages (in our case, Virtual DOM elements) to the drivers. Read the next chapter to get familiar with this pattern.

## Quick Start

In the future, you can quickly set up a development and production ready Cycle.js project using the [cyc](https://github.com/edge/cyc) boilerplate.

It comes with babel transpilation, hot-reloading, and an isomorphic server.

## Cycle.js as a script

In the rare occasion you need Cycle.js scripts as standalone JavaScript files, you can download them from [unpkg](https://unpkg.com):

- Latest Cycle.js [xstream run](https://unpkg.com/@cycle/xstream-run/dist/cycle.js)
- Latest Cycle.js [most.js run](https://unpkg.com/@cycle/most-run/dist/cycle-most-run.js)
- Latest Cycle.js [RxJS v5 run](https://unpkg.com/@cycle/rxjs-run/dist/cycle.js)
- Latest Cycle.js [RxJS v4 run](https://unpkg.com/@cycle/rx-run/dist/cycle.js)
- Latest Cycle.js [DOM](https://unpkg.com/@cycle/dom/dist/cycle-dom.js)
- Latest Cycle.js [HTTP](https://unpkg.com/@cycle/http/dist/cycle-http-driver.js)
- Latest Cycle.js [Isolate](https://unpkg.com/@cycle/isolate/dist/cycle-isolate.js)
