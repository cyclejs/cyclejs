<h1>
<img src="https://raw.github.com/staltz/cycle/master/logo.png" /> Cycle.js
</h1>

> Cycle.js is a reactive and functional JavaScript framework, where the user is a function, the computer is a function, and Human-Computer Interaction is a fixed point equation over reactive event streams.

* **Honestly Reactive**: the building blocks in Cycle are Observables from [RxJS](https://github.com/Reactive-Extensions/RxJS), which simplifies all code related to events, asynchrony, and errors. Structuring the app with RxJS also separates concerns, because Rx decouples data production from data consumption. As result, apps in Cycle have nothing comparable to imperative calls such as `setState()`, `forceUpdate()`, `replaceProps()`, `handleClick()`, etc.
* **Functional Unidirectional Dataflow**: Cycle's core abstraction is Human-Computer Interaction modelled as an interplay between two pure functions: `user()` and `computer()`. The computer outputs what the user takes as input, and vice-versa, leading to the fixed point equation `x = user(computer(x))`. This is what we call "Functional Unidirectional Dataflow", and as an app developer you only need to specify the `computer()` function.
* **Functions, not classes**: the computer function (`main()`) takes Observables as input, and outputs Observables. To architecture your app, you only need to split the `main()` into functions over Observables. Pure functional composition is the tool for creating architectures in Cycle. Functions also facilitate automating tests, and allow for a JavaScript programming style without the pitfalling `this`.
* **Virtual DOM Rendering**: the `main()` function should output an Observable of "Virtual DOM Elements" from the [virtual-dom](https://github.com/Matt-Esch/virtual-dom) library, to keep performance fast by patching the actual DOM with only the minimum necessary changes.
* **Work in progress**: API design is the current priority and might significantly evolve, performance and other issues are left aside before this gets stable.

[![npm version](https://badge.fury.io/js/cyclejs.svg)](http://badge.fury.io/js/cyclejs)

## Example

```javascript
import Cycle from 'cyclejs';
let {h} = Cycle;

function main(drivers) {
  return {
    DOM: drivers.get('DOM', '.myinput', 'input')
      .map(ev => ev.target.value)
      .startWith('')
      .map(name =>
        h('div', [
          h('label', 'Name:'),
          h('input.myinput', {attributes: {type: 'text'}}),
          h('hr'),
          h('h1', 'Hello ' + name)
        ])
      )
  };
}

Cycle.run(main, {
  DOM: Cycle.makeDOMDriver('.js-container')
});
```

The input of `main` is `drivers`, a queryable collection of Observables from the "external world", containing for instance user events happening on elements on the DOM.
`drivers.get('DOM', selector, eventType)` returns an Observable of `eventType` events happening on elements specified by `selector`. This goes through a series of RxJS operations to produce an Observable of virtual DOM elements, which is returned and tagged `DOM`. Function `Cycle.run()` will take your `main` function and circularly connect it to the specified "driver functions". The DOM driver function acts on behalf of the user: takes the tagged `DOM` Observable of virtual elements returned from `main()`, shows that on the screen as a side-effect, and outputs Observables of user interaction events. The result of this is Human-Computer Interaction, i.e. a dialogue between `main()` and the DOM driver function, happening under the container element selected by `'.js-container'`.

For advanced examples, check out [TodoMVC implemented in Cycle.js](https://github.com/staltz/todomvc-cycle) and [RxMarbles](https://github.com/staltz/rxmarbles).

## Installing

`npm install cyclejs`

## Learn more

The `main()` function is normally refactored as a composition of other functions, of which the Model-View-Intent (MVI) composition is a useful one, but far from being the only one. In other words:

```js
function main(drivers) {
  return view(model(intent(drivers)));
}
```

Model-View-Intent is an architecture similar to Flux, and Virtual DOM Rendering is inspired by React, however there are several differences worth paying attention. Read the [seminal blog post that lead to the creation of Cycle.js](http://futurice.com/blog/reactive-mvc-and-the-virtual-dom). One can create any type of circular architecture, including variants of Flux where Store, Controller-View, and Action are functions, similarly to Model-View-Intent.

Cycle also supports custom elements ("components"), and the abstraction here is to emulate web components as close as possible. Eventually, web component emulation will be replaced with actual web components implemented through Cycle.js.

Cycle.js has [virtual-dom](https://github.com/Matt-Esch/virtual-dom) and [RxJS](https://github.com/Reactive-Extensions/RxJS) as hard dependencies. It is a small "glue" framework providing helpers for building circular architectures properly with those technologies. Cycle.js's code itself is still under 600 lines of code only.

## Why?

Why would you use Cycle.js instead of other web frameworks such as Angular and React/Flux? Here are a couple of strong reasons:

- **The only (yet) 100% reactive frontend framework.** The truth is, if you really wanted to apply reactive programming everywhere in a single page app, you would have no other choice than Cycle. This is not yet another Flux library. I built it because it doesn't exist elsewhere. I want to structure apps as observable event streams as much as possible, while minimizing the use of `subscribe`, side effects, and `this`.
- **Sliceability.** Most frameworks claim to provide Separation of Concerns, but often they prescribe rigid containers where to place your code: Models, Views, Controllers, Components, Routes, Services, Dispatcher, Store, Actions, Templates, etc. Cycle has none of that. Instead, pure functions over immutable Observables and data structures (such as from [mori](https://swannodette.github.io/mori/) and [Immutable.js](https://facebook.github.io/immutable-js/)) allow you to *slice* your program wherever you wish. Plus, the reactive pattern makes it possible for no module to have functions such as `a.updateSomethingIn(b)` which inherently create coupling between `a` and `b`. You can write code with single responsibilities throughout. For instance, the View function in MVI just takes model data and renders virtual elements, it doesn't even have callbacks to handle events. Views aren't even aware of events (click, input, etc) that can happen on them. Additionally, Rendering is separated from View. Because it just outputs virtual DOM elements, it allows for testing without depending on the DOM. Other benefits include being able to swap the DOM renderer with a Canvas renderer or a Cocoa UI tree renderer or whatever other target you wish.
- **Great testability.** Everything is a JavaScript function or an Rx.Observable, so testing is mostly a matter of feeding input and inspecting the output. You can also mock the `user()` function.
- **Welcomes immutable and stateless programming.** Cycle.js is built for, in combination with RxJS and immutable data structure libraries, a programming style that favors immutability and statelessness. This allows code to be clearer and less prone to bugs. Apps written in Cycle.js are `this`-less. See it for yourself, `this` cannot be found in [Cycle.js TodoMVC](https://github.com/staltz/todomvc-cycle/tree/master/js).

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
- [Cycle-React](https://github.com/pH200/cycle-react) use React instead of virtual-dom with a Cycle-like API, by [https://github.com/pH200](pH200)

## Disclaimer

### Work in progress

Cycle.js is in alpha mode, many changes to the API will likely occur before v1.0 is released. Use this framework only for experiments before that. PS: we don't want to stay as alpha forever, either. ;)

Prior to v1.0.0, the versions will follow the convention: improvements that break backwards compatibility increment the minor number, any other improvements will increment the patch number. After v1.0.0, we will follow [semver](http://semver.org/).

## Acknowledgements

- This project is a grateful recipient of the [Futurice Open Source sponsorship program](http://futurice.com/blog/sponsoring-free-time-open-source-activities).
- [@dobrite](https://github.com/dobrite) for [boilerplate reduction ideas](https://github.com/staltz/cycle/issues/56).
- [@erykpiast](https://github.com/erykpiast) for pull requests and great ideas.
- [@pH200](https://github.com/pH200) for pull requests and amazing contributions.

## LICENSE

[The MIT License (MIT)](https://github.com/staltz/cycle/blob/master/LICENSE)

- - -

[![Build Status](https://travis-ci.org/staltz/cycle.svg?branch=master)](https://travis-ci.org/staltz/cycle)
[![Code Climate](https://codeclimate.com/github/staltz/cycle/badges/gpa.svg)](https://codeclimate.com/github/staltz/cycle)
[![Dependency Status](https://david-dm.org/staltz/cycle.svg)](https://david-dm.org/staltz/cycle)
[![devDependency Status](https://david-dm.org/staltz/cycle/dev-status.svg)](https://david-dm.org/staltz/cycle#info=devDependencies)
