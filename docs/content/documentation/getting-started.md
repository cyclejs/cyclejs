# Getting started

## Consider create-cycle-app

The quickest way to create a new project with Cycle.js is by using [create-cycle-app](https://github.com/cyclejs-community/create-cycle-app), giving you the choice between ES6 or TypeScript, Browserify or Webpack.

> [create-cycle-app >](https://github.com/cyclejs-community/create-cycle-app)

First install Create Cycle App globally in your system.

```bash
npm install --global create-cycle-app
```

Then, this command will create a project called *my-awesome-app* (or another name of your choice) with Cycle *Run* and Cycle *DOM*.

```
create-cycle-app my-awesome-app
```

If you want to use typescript use the `one-fits-all` flavor.
```
create-cycle-app my-awesome-app --flavor cycle-scripts-one-fits-all
```

## Install from npm

If you want to have more control over your project, the recommended channel for downloading Cycle.js as a package is through [npm](http://npmjs.org/).

Create a new directory and run this npm command inside that directory. This installs [xstream](http://staltz.com/xstream), Cycle *Run*, and Cycle *DOM*.

```
npm install xstream @cycle/run @cycle/dom
```

Packages *xstream* and *Run* are the minimum required API to work with Cycle.js. The *Run* package includes a single function `run()`, and Cycle *DOM* is the standard DOM Driver providing a way to interface with the DOM. You can also use Cycle.js with other stream libraries like RxJS or Most.js.

> We recommend xstream if you don't know what to choose.

```
npm install xstream @cycle/run
```

> [RxJS](http://reactivex.io/rxjs)

```
npm install rxjs @cycle/rxjs-run
```

> [Most.js](https://github.com/cujojs/most)

```
npm install most @cycle/most-run
```

Note: packages of the type `@org/package` are [npm scoped packages](https://docs.npmjs.com/getting-started/scoped-packages), supported if your npm installation is version 2.11 or higher. Check your npm version with `npm --version` and upgrade in order to install Cycle.js.

In case you are not dealing with a DOM-interfacing web application, you can omit `@cycle/dom` when installing.

## Coding

We recommend the use of a bundling tool such as [browserify](http://browserify.org/) or [webpack](http://webpack.github.io/), in combination with ES6 (a.k.a. ES2015) through a transpiler (e.g. [Babel](http://babeljs.io/) or [TypeScript](http://typescriptlang.org/)). Most of the code examples in this documentation assume some basic familiarity with ES6.

### Import libraries

Once your build system is set up, start writing your main JavaScript source file like this, to import the libraries. The second line imports the function `run(main, drivers)`, where `main` is the entry point for our whole application, and `drivers` is a record of driver functions labeled by some name.

```js
import xs from 'xstream';
import {run} from '@cycle/run';
import {makeDOMDriver} from '@cycle/dom';

// ...
```

### Create `main` and `drivers`

Then, write a `main` function, for now with empty contents. `makeDOMDriver(container)` from Cycle *DOM* returns a driver function to interact with the DOM. This function is registered under the key `DOM` in the `drivers` object.

```js
function main() {
  // ...
}

const drivers = {
  DOM: makeDOMDriver('#app')
};
```

Then, call `run()` to connect the main function with the drivers.

```js
run(main, drivers);
```

### Send messages from `main`

We have filled the `main()` function with some code: returns an object `sinks` which has an `xstream` stream defined under the name `DOM`. This indicates `main()` is sending the stream as messages to the DOM driver. Sinks are outgoing messages. The stream emits Virtual DOM `<h1>` elements displaying `${i} seconds elapsed` changing over time every second, where `${i}` is replaced by `0`, `1`, `2`, etc.

```js
function main() {
  const sinks = {
    DOM: xs.periodic(1000).map(i =>
      h1('' + i + ' seconds elapsed')
    )
  };
  return sinks;
}
```

Also, remember to import `h1` from Cycle DOM.

> In the beginning of the file:

```js
import {makeDOMDriver, h1} from '@cycle/dom';
```

### Catch messages into `main`

Function `main()` now takes `sources` as input. Just like the output `sinks`, the input `sources` follow the same structure: an object containing `DOM` as a property. Sources are incoming messages. `sources.DOM` is an object with a queryable API to get streams. Use `sources.DOM.select(selector).events(eventType)` to get a stream of `eventType` DOM events happening on the element(s) specified by `selector`. This `main()` function takes the stream of `click` events happening on `input` elements, and maps those toggling events to Virtual DOM elements displaying a togglable checkbox.

```js
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
```

Remember to import new element types from Cycle DOM.

> In the beginning of the file:

```js
import {makeDOMDriver, div, input, p} from '@cycle/dom';
```

### Consider JSX

We used the `div()`, `input()`, `p()` helper functions to create virtual DOM elements for the respective `<div>`, `<input>`, `<p>` DOM elements, but you can also use JSX with Babel. The following only works if you are building with Babel:

(1) Install the npm packages [babel-plugin-transform-react-jsx](http://babeljs.io/docs/plugins/transform-react-jsx/) and [snabbdom-jsx](https://www.npmjs.com/package/snabbdom-jsx).

```
npm install --save babel-plugin-transform-react-jsx snabbdom-jsx
```

(2) Specify a pragma for JSX in the `.babelrc` file.

> .babelrc

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

(3) Import Snabbdom JSX.

> main.js

```js
import xs from 'xstream';
import {run} from '@cycle/xstream-run';
import {makeDOMDriver} from '@cycle/dom';
import {html} from 'snabbdom-jsx';
```

(4) Use JSX as return values.

This example portrays the most common problem-solving pattern in Cycle.js: formulate the computer's behavior as a function of streams: continuously listen to source messages from drivers and continuously provide sinks messages (in our case, Virtual DOM elements) to the drivers. Read the next chapter to get familiar with this pattern.

```jsx
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
```

## Install without npm

In the rare occasion you need Cycle.js scripts as standalone JavaScript files, you can download them from [unpkg](https://unpkg.com) directly into your HTML file:

- Latest Cycle.js [run](https://unpkg.com/@cycle/run/dist/cycle-run.js)
- Latest Cycle.js [most.js run](https://unpkg.com/@cycle/most-run/dist/cycle-most-run.js)
- Latest Cycle.js [RxJS run](https://unpkg.com/@cycle/rxjs-run/dist/cycle.js)
- Latest Cycle.js [DOM](https://unpkg.com/@cycle/dom/dist/cycle-dom.js)
- Latest Cycle.js [HTTP](https://unpkg.com/@cycle/http/dist/cycle-http-driver.js)
- Latest Cycle.js [Isolate](https://unpkg.com/@cycle/isolate/dist/cycle-isolate.js)
