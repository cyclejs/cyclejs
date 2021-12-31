## Dataflow

> **Your app and the external world as a circuit**

<p>
  <img src="img/cycle-nested-frontpage.svg">
</p>

Cycle's core abstraction is your application as a pure function `main()` where inputs are read effects (*sources*) from the external world and outputs (*sinks*) are write effects to affect the external world. These I/O effects in the external world are managed by *drivers*: plugins that handle DOM effects, HTTP effects, etc.

The internals of `main()` are built using Reactive Programming primitives, which maximizes separation of concerns and provides a fully declarative way of organizing your code. The *dataflow* is plainly visible in the code, making it readable and traceable.

## Example

```
npm install xstream @cycle/run @cycle/dom
```

```js
import {run} from '@cycle/run'
import {div, label, input, hr, h1, makeDOMDriver} from '@cycle/dom'

function main(sources) {
  const input$ = sources.DOM.select('.field').events('input')

  const name$ = input$.map(ev => ev.target.value).startWith('')

  const vdom$ = name$.map(name =>
    div([
      label('Name:'),
      input('.field', {attrs: {type: 'text'}}),
      hr(),
      h1('Hello ' + name),
    ])
  )

  return { DOM: vdom$ }
}

run(main, { DOM: makeDOMDriver('#app-container') })
```

> Output:

<div class="example-hello-world-container"></div>

## Functional and Reactive

Functional enables "predictable" code, and Reactive enables "separated" code. Cycle.js apps are made of pure functions, which means you know they only take inputs and generate predictable outputs, without performing any I/O effects. The building blocks are reactive streams from libraries like [xstream](http://staltz.com/xstream), [RxJS](http://reactivex.io/rxjs) or [Most.js](https://github.com/cujojs/most/), which greatly simplify code related to events, asynchrony, and errors. Structuring the application with streams also separates concerns, because all [dynamic updates to a piece of data are co-located](streams.html#streams-reactive-programming) and impossible to change from outside. As a result, apps in Cycle are entirely `this`-less and have nothing comparable to imperative calls such as `setState()` or `update()`.

## Simple and Concise

Cycle.js is a framework with very few concepts to learn. The core API has just one function: `run(app, drivers)`. Besides that, there are **streams**, **functions**, **drivers** (plugins for different types of I/O effects), and a helper function to isolate scoped components. This is a framework with very little "magic". Most of the building blocks are just JavaScript functions. Usually the lack of "magic" leads to very verbose code, but since functional reactive streams are able to build complex dataflows with a few operations, you will come to see how apps in Cycle.js are small and readable.

## Extensible and Testable

Drivers are plugin-like simple functions that take messages from sinks and call imperative functions. All I/O effects are contained in drivers. This means your application is just a pure function, and it becomes easy to swap drivers around. The community has built drivers for [React Native](https://github.com/cyclejs/cycle-react-native), [HTML5 Notification](https://github.com/cyclejs/cycle-notification-driver), [Socket.io](https://github.com/cgeorg/cycle-socket.io), etc. Sources and sinks can be easily used as [Adapters and Ports](https://iancooper.github.io/Paramore/ControlBus.html). This also means testing is mostly a matter of feeding inputs and inspecting the output. No deep mocking needed. Your application is just a pure transformation of data.

## Explicit dataflow

In every Cycle.js app, each of the stream declarations is a node in a dataflow graph, and the dependencies between declarations are arrows. This means there is a one-to-one correspondence between your code and *minimap*-like graph of the dataflow between external inputs and external outputs.

<p class="dataflow-minimap">
  <img src="img/dataflow-minimap.svg">
</p>

```js
function main(sources) {
  const decrement$ = sources.DOM
    .select('.decrement').events('click').mapTo(-1);

  const increment$ = sources.DOM
    .select('.increment').events('click').mapTo(+1);

  const action$ = xs.merge(decrement$, increment$);
  const count$ = action$.fold((x, y) => x + y, 0);

  const vdom$ = count$.map(count =>
    div([
      button('.decrement', 'Decrement'),
      button('.increment', 'Increment'),
      p('Counter: ' + count)
    ])
  );
  return { DOM: vdom$ };
}
```

In many frameworks the flow of data is *implicit*: you need to build a mental model of how data moves around in your app. In Cycle.js, the flow of data is clear by reading your code. The dataflow graph can also be viewed in the [Cycle.js DevTool for Chrome](https://github.com/cyclejs/cyclejs/tree/master/devtool), which shows data moving in real-time through the graph:

<p>
  <img src="img/devtool.png" style="max-height:inherit">
</p>

## Composable

Cycle.js has components, but unlike other frameworks, every single Cycle.js app, no matter how complex, is a function that can be reused in a larger Cycle.js app.

<p>
  <img src="img/nested-components.svg">
</p>

Sources and sinks are the interface between the application and the drivers, but they are also the interface between a child component and its parent. Cycle.js components can be simply GUI widgets like in other frameworks, but they are not limited to GUIs only. You can make Web Audio components, network requests components, and others, since the sources/sinks interface is not exclusive to the DOM.

## Learn it in 1h 37min

<p>
  <img src="img/egghead.svg">
</p>

Got 1 hour and 32 minutes? That is all it takes to learn the essentials of Cycle.js. Watch [**this free Egghead.io video course**](https://app.egghead.io/playlists/cycle-js-fundamentals) given by the creator of Cycle.js. Understand Cycle.js from within by following how it is built from scratch, then learn how to transform your ideas into applications.

## Supports...

- [**Virtual DOM rendering**](https://github.com/cyclejs/cyclejs/tree/master/dom)
- [**Server-side rendering**](https://github.com/cyclejs/cyclejs/tree/master/examples/advanced/isomorphic)
- [**JSX**](http://cycle.js.org/getting-started.html)
- [**TypeScript**](https://github.com/cyclejs/cyclejs/tree/master/examples/intermediate/bmi-typescript)
- [**React Native**](https://github.com/cyclejs/cycle-react-native)
- [**Time traveling**](https://github.com/cyclejs/cycle-time-travel)
- [**Routing with the History API**](https://github.com/cyclejs/cyclejs/tree/master/history)
- [**And more...**](https://github.com/cyclejs-community/awesome-cyclejs)


[Read the docs >](getting-started.html)
