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
* **Unidirectional Dataflow**: Cycle is essentially a tool to build circular-dependent 
  event streams. This enables any circular unidirectional architecture to be built easily.
  In particular, the Model-View-User-Intent architecture is easy to build with Cycle: data
  moves from Model to View, graphics move from View to User, User generates interaction
  events, Intent interprets those events as "user intentions", and these are fed to the
  Model. Model handles information, View handles display, User is yourself, and Intent 
  handles interaction. They are tied together as a circular loop, each one reacting to 
  the preceding, but none is manipulating the others.
* **Functions, not classes**: each object in the circular architecture is an event stream.
  Model, View, User and Intent are simply functions over event streams. These are the only
  concepts needed for building applications. Pure functional composition is the tool for
  creating architectures in Cycle. Functions also facilitate automating tests, and allow 
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
import Cycle from 'cyclejs';
let {Rx, h} = Cycle;

let name$ = Cycle.createStream(function model(changeName$) {
  return Rx.Observable.just('').merge(changeName$);
});

let vtree$ = Cycle.createStream(function view(name$) {
  return name$.map(name =>
    h('div', [
      h('label', 'Name:'),
      h('input.field', {attributes: {type: 'text'}}),
      h('h1.header', `Hello ${name}`)
    ])
  );
});

let interaction$ = Cycle.createStream(function user(vtree$) {
  return Cycle.render(vtree$, '.js-container').interaction$;
});

let changeName$ = Cycle.createStream(function intent(interaction$) {
  return interaction$.choose('.field', 'input').map(ev => ev.target.value);
});

name$.inject(changeName$).inject(interaction$).inject(vtree$).inject(name$);
```

Notice that each of the 4 streams takes its preceding neighbour stream as input, hence the
circularly-dependent streams. Model, View, and Intent are functions. The User is also a
function: it takes vtree$ as input, renders them to the DOM into `.js-container`, and 
outputs interaction event streams that can be accessed through 
`interaction$.choose(selector, eventName)`. At the bottom, `inject()` ties everything
together, pointing each stream to its appropriate input.

Because this code uses pure functions (model, view, user, intent), we are not constrained
to 4 streams and 4 functions. In fact, the code above can be refactored to be more concise:

```js
import Cycle from 'cyclejs';
let {Rx, h} = Cycle;

let vtree$ = Cycle.createStream(function computer(interaction$) {
  return interaction$.choose('.field', 'input')
    .map(ev => ev.target.value)
    .startWith('')
    .map(name =>
      h('div', [
        h('label', 'Name:'),
        h('input.field', {attributes: {type: 'text'}}),
        h('h1.header', `Hello ${name}`)
      ])
    );
});

let interaction$ = Cycle.createStream(function user(vtree$) {
  return Cycle.render(vtree$, '.js-container').interaction$;
});

interaction$.inject(vtree$).inject(interaction$);
```

For advanced examples, check out [TodoMVC implemented in Cycle.js](https://github.com/staltz/todomvc-cycle) and [RxMarbles](https://github.com/staltz/rxmarbles).

## Installing

`npm install cyclejs`

or

`bower install cycle`

## Learn more

Model-View-User-Intent is an architecture similar to Flux, and Virtual DOM Rendering is 
inspired by React, however there are several differences worth paying attention. Read the 
[seminal blog post that lead to the creation of Cycle.js](http://futurice.com/blog/reactive-mvc-and-the-virtual-dom).
One can create any type of circular architecture, including variants of Flux where Store, 
Controller-View, and Action are functions, similarly to Model-View-User-Intent.

Cycle.js has [virtual-dom](https://github.com/Matt-Esch/virtual-dom) and [RxJS](https://github.com/Reactive-Extensions/RxJS)
as hard dependencies. It is a small "glue" framework providing helpers for building 
circular architectures properly with those technologies. Cycle.js's code itself is still 
under 600 lines of code only.

## Why?

Why would you use Cycle.js instead of other web frameworks such as Angular and React/Flux?
Here are a couple of strong reasons:

- **The only (yet) 100% reactive frontend framework.** The truth is, if you really wanted
  to apply reactive programming everywhere in a single page app, you would have no other
  choice than Cycle. This is not yet another Flux library. I built it because it doesn't
  exist elsewhere. I want to structure apps as observable event streams as much as possible,
  while minimizing the use of `subscribe`, side effects, and `this`.
- **Separation of concerns.** The reactive pattern for circular architectures makes it
  possible for no module to have functions such as `updateSomething()` which inherently
  create coupling. You can write code with single responsibilities throughout. For
  instance, the View just takes model data and renders virtual elements, it doesn't even
  have callbacks to handle events. Views aren't even aware of events (click, input, etc)
  that can happen on them. Additionally, Rendering is separated from View. Contrary
  to what you expect, a View in Cycle.js does not directly render anything to the browser.
  Instead, it just outputs virtual DOM elements. This allows for testing without depending
  on the DOM, besides other benefits such as being able to hypothetically swap the DOM
  renderer with a Canvas renderer or a Cocoa UI tree renderer or whatever other target 
  you wish.
- **Great unit testability.** Everything is a JavaScript function or an Rx.Observable,
  so testing is mostly a matter of feeding input and inspecting the output.
- **Welcomes immutable and stateless programming.** Cycle.js is built for, in
  combination with RxJS, a programming style that favors immutability and statelessness.
  This allows code to be clearer and less prone to bugs. Apps written in Cycle.js are
  `this`-less. See it for yourself, `this` cannot be found in [Cycle.js TodoMVC](https://github.com/staltz/todomvc-cycle/tree/master/js).

## Community

* Ask "_how do I...?_" questions in Gitter: <br />[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/staltz/cycle?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
* Propose and discuss significant changes as a GitHub issues

### Resources

- [Cycle.js examples using JSX and ES6](https://github.com/ivan-kleshnin/cyclejs-examples) by [@ivan-kleshnin](https://github.com/ivan-kleshnin)
- [TodoMVP, an example webapp written in Cycle.js](https://github.com/cgeorg/todomvp) by [@cgeorg](https://github.com/cgeorg)
- [sinject, a dependency injection tool supporting Cycle's circular dependencies](https://github.com/cgeorg/sinject) by [@cgeorg](https://github.com/cgeorg)
- [Slack trend searching written in Cycle.js](https://github.com/grozen/trends-cycle) by [@grozen](https://github.com/grozen)
- [RxMarbles is written in Cycle.js](https://github.com/staltz/rxmarbles)
- [An advanced Web Component built with Cycle.js](https://github.com/erykpiast/autocompleted-select) by [@erykpiast](https://github.com/erykpiast)

## Disclaimer

### Work in progress

Cycle.js is in alpha mode, many changes to the API will likely occur before v1.0 is released.
Use this framework only for experiments before that. PS: we don't want to stay as alpha
forever, either. ;)

Prior to v1.0.0, the versions will follow the convention: improvements that break backwards
compatibility increment the minor number, any other improvements will increment the patch
number. After v1.0.0, we will follow [semver](http://semver.org/).

## Acknowledgements

- This project is a grateful recipient of the [Futurice Open Source sponsorship program](http://futurice.com/blog/sponsoring-free-time-open-source-activities).
- [@dobrite](https://github.com/dobrite) for [boilerplate reduction ideas](https://github.com/staltz/cycle/issues/56).
- [@erykpiast](https://github.com/erykpiast) for pull requests and great ideas.

## LICENSE

[The MIT License (MIT)](https://github.com/staltz/cycle/blob/master/LICENSE)
