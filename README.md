<h1>
<img src="https://raw.github.com/staltz/cycle/master/logo.png" /> Cycle.js
</h1>

> A web application framework using the Reactive Model-View-Intent architecture and Virtual
DOM Rendering.

* **Honestly Reactive**: the building blocks in Cycle are event-driven and [RxJS](https://github.com/Reactive-Extensions/RxJS)
  is a hard dependency, which simplifies all code related to events, asynchrony, and
  errors. Structuring the app with RxJS also separates concerns, because Rx decouples
  data production from data consumption. As result, apps in Cycle have nothing comparable
  to imperative calls such as `setState()`, `forceUpdate()`, `replaceProps()`,
  `handleClick()`, etc.
* **Unidirectional Dataflow**: based on the Model-View-Intent architecture, data moves
  from Model to View, events move from View to Intent, and Intent emits "user intentions"
  to the Model. Model handles information, View handles display, Intent handles interaction.
  They are tied together as a circular loop, each one reacting to the other, but none is
  controlling the others.
* **Functions, not classes**: each node in the MVI cycle behaves like a function,
  receiving events as input, and outputting events. No side effects. This makes it
  convenient for composing with other components, or for automating tests. It also allows
  for a JavaScript programming style without the pitfalling `this`.
* **Virtual DOM Rendering**: Views re-render completely whenever Models emit any data.
  The use of [virtual-dom](https://github.com/Matt-Esch/virtual-dom) keeps performance
  fast by patching the actual DOM with only the minimum necessary changes.
* **Work in progress**: API design is the current priority and might significantly evolve,
  performance and other issues are left aside before this gets stable.

[![npm version](https://badge.fury.io/js/cyclejs.svg)](http://badge.fury.io/js/cyclejs)
[![Bower version](https://badge.fury.io/bo/cycle.svg)](http://badge.fury.io/bo/cycle)
[![Build Status](https://travis-ci.org/staltz/cycle.svg?branch=master)](https://travis-ci.org/staltz/cycle)
[![Code Climate](https://codeclimate.com/github/staltz/cycle/badges/gpa.svg)](https://codeclimate.com/github/staltz/cycle)
[![Dependency Status](https://david-dm.org/staltz/cycle.svg)](https://david-dm.org/staltz/cycle)
[![devDependency Status](https://david-dm.org/staltz/cycle/dev-status.svg)](https://david-dm.org/staltz/cycle#info=devDependencies)

## Example

```javascript
var Cycle = require('cyclejs');
var h = Cycle.h;

var Model = Cycle.createModel(Intent =>
  ({name$: Intent.get('changeName$').startWith('')})
});

var View = Cycle.createView(Model =>
  ({
    vtree$: Model.get('name$').map(name =>
      h('div', [
        h('label', 'Name:'),
        h('input.field', {attributes: {type: 'text'}}),
        h('h1', 'Hello ' + name)
      ])
    )
  })
);

var User = Cycle.createDOMUser('.js-container');

var Intent = Cycle.createIntent(User =>
  ({changeName$: User.event$('.field', 'input').map(ev => ev.target.value)})
);

User.inject(View).inject(Model).inject(Intent).inject(User);
```

Notice that each of the 4 parts has a preceding neighbour as input, and each outputs
an object containing RxJS Observables. The User is also of the same nature as the others:
it takes View's vtree$ as input, renders them to the DOM into `.js-container`, and outputs
event streams that can be accessed through `User.event$(selector, eventName)`. At the
bottom, `inject()` just ties all four Model, View, User, and Intent together by telling
them that they depend on each other circularly.

For advanced examples, check out [TodoMVC implemented in Cycle.js](https://github.com/staltz/todomvc-cycle) and [RxMarbles](https://github.com/staltz/rxmarbles).

## Installing through npm

`npm install cyclejs`

## Installing through Bower

`bower install cycle`

## Learn more

Model-View-Intent is similar to Flux, and Virtual DOM Rendering is inspired by React,
however there are several differences worth paying attention. Read the [seminal blog post
that lead to the creation of Cycle.js](http://futurice.com/blog/reactive-mvc-and-the-virtual-dom).

It has [virtual-dom](https://github.com/Matt-Esch/virtual-dom) and [RxJS](https://github.com/Reactive-Extensions/RxJS)
as hard dependencies. Cycle.js is a "glue" framework providing helpers for building the
Model-View-Intent architecture properly with those technologies. Cycle.js's code itself is
still under 600 lines of code only.

## Why?

Why would you use Cycle.js instead of other web frameworks such as Angular and React? Here
are a couple of strong reasons:

- **The only (yet) 100% reactive frontend framework.** The truth is, if you really wanted
  to apply reactive programming everywhere in a single page app, you would have no other
  choice than Cycle. This is not yet another Flux library. I built it because it doesn't
  exist elsewhere. I want to structure apps as observable event streams as much as possible,
  while minimizing the use of `subscribe`, side effects, and `this`.
- **Separation of concerns.** The reactive pattern for Models, Views, and Intents makes it
  possible for no component to have functions such as `updateSomething()` which inherently
  create coupling. You can write code with single responsibilities throughout. For
  instance, the View just takes model data and renders virtual elements, it doesn't even
  have callbacks to handle events. Additionally, Rendering is separated from View. Contrary
  to what you expect, a View in Cycle.js does not directly render anything to the browser.
  Instead, it just outputs virtual DOM elements. This allows for testing without depending
  on the DOM, besides other benefits such as being able to hypothetically swap the DOM
  Renderer with a Cocoa UI tree Renderer or whatever other target you wish.
- **Great unit testability.** Everything is a JavaScript function or a [DataFlowNode](https://github.com/staltz/cycle/blob/master/docs/data-flow-nodes.md),
  so testing is mostly a matter of feeding input and inspecting the output.
- **Welcomes immutable and stateless programming.** Cycle.js is built for, in
  combination with RxJS, a programming style that favors immutability and statelessness.
  This allows code to be clearer and less prone to bugs. Apps written in Cycle.js are
  `this`-less. See it for yourself, `this` cannot be found in [Cycle.js TodoMVC](https://github.com/staltz/todomvc-cycle/tree/master/js).

## Community

* Ask "_how do I...?_" questions in Gitter: <br />[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/staltz/cycle?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
* Propose and discuss significant changes as a GitHub issues

## Disclaimer

### Work in progress

Cycle.js is in alpha mode, many changes to the API will likely occur before v1.0 is released.
Use this framework only for experiments before that. PS: we don't want to stay as alpha
forever, either. ;)

Prior to v1.0.0, the versions will follow the convention: improvements that break backwards
compatibility increment the minor number, any other improvements will increment the patch
number. After v1.0.0, we will follow [http://semver.org/](semver).

## Acknowledgements

- This project is a grateful recipient of the [Futurice Open Source sponsorship program](http://futurice.com/blog/sponsoring-free-time-open-source-activities).
- [@dobrite](https://github.com/dobrite) for [boilerplate reduction ideas](https://github.com/staltz/cycle/issues/56).
- [@erykpiast](https://github.com/erykpiast) for pull requests.

## LICENSE

[The MIT License (MIT)](https://github.com/staltz/cycle/blob/master/LICENSE)
