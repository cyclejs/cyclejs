# Circularly dependent Rx Observables

Cycle.js is above all a library for creating circularly-dependent RxJS Observables, and
enabling web user interfaces to be created with Observables. Circularly-dependent
Observables are necessary if we are to architect applications as a loop: Model affects
View, View is displayed to the User, the User creates interactions, Intent interprets or
pre-processes interaction events, and the Model listens for requests made by the Intent.
In each of these, we represent data and events as an Observable, hence the need for a
circular dependency solution.

Suppose you need Observables `a$` and `b$` to be circularly dependent, for instance:

```js
function defineA$(b$) {
  return b$.map(b => 10 * b);
}

function defineB$(a$) {
  return a$.delay(2000);
}

let a$ = defineA$(b$);
let b$ = defineB$(a$);
```

The first line `let a$ = defineA$(b$)` cannot execute because `b$` is not yet defined. The
second line can execute, though. There is no way of reordering this to make it work. 
Either way, we need `b$` defined before creating `a$`, and we need `a$` defined before
creating `b$`.

Cycle solves this by introducing a proxy for the input Observable. After applying the
function on the proxy, you get an output Observable. Later, the real input is provided,
and the proxy Observable will imitate the behavior of the real input Observable. This
approach is roughly:

```js
let aProxy$ = new Rx.Subject();
let bProxy$ = new Rx.Subject();

function defineA$(b$) {
  return b$.map(b => 10 * b);
}

function defineB$(a$) {
  return a$.delay(2000);
}

let a$ = defineA$(bProxy$);
let b$ = defineB$(aProxy$);

a$.subscribe(a => aProxy$.onNext(a)); // aProxy$ imitates a$
b$.subscribe(b => bProxy$.onNext(b)); // bProxy$ imitates b$
```

Doing this would introduce too much boilerplate for creating and handling proxies, besides
being a mutable technique. Cycle does essentially the above, but hidden behind a 
convenient factory function.

# Cycle Streams

To apply the deferred input Observable technique, you create a Cycle *Stream* using the
factory function `createStream()`. A Cycle Stream is a subclass of Rx.Observable, and 
introduces one function: `inject(input)`. It is through this inject function that the 
Stream will receives its "real" input Observable. The example in the previous section, 
using Cycle Streams, is:

```js
function defineA$(b$) {
  return b$.map(b => 10 * b);
}

function defineB$(a$) {
  return a$.delay(2000);
}

let a$ = Cycle.createStream(defineA$);
let b$ = Cycle.createStream(defineB$);

a$.inject(b$);
b$.inject(a$);
```

Often the definition function is given inline into `createStream()`, as such:

```js
let a$ = Cycle.createStream(function defineA$(b$) {
  return b$.map(b => 10 * b);
});

let b$ = Cycle.createStream(function defineB$(a$) {
  return a$.delay(2000);
});

a$.inject(b$);
b$.inject(a$);
```

When invoking the factory `createStream(definitionFn)`, it inspects how many inputs does
`definitionFn` have, creates proxy input Observables respectively, applies `definitionFn`
on those proxies, then returns the Observable that `definitionFn` returns, with the
`inject` function attached to it which knows how to take the given injected inputs and 
make the proxies imitate them.

Injection is an important concept for cyclic programs, and you can consider that the 
"Injectable" interface exists throughout your codebase, although not existing in practice.
You might also want to group a set of related Streams, and expose an `inject()` function
for this group, for example with this view depending on a model:

```js
var view = (function () {
  var vtree$ = Cycle.createStream(function (color$, tickerExists$) {
    return Rx.Observable.combineLatest(color$, tickerExists$,
      function (color, tickerExists) {
        return h('div#the-view', [
          tickerExists ? h('ticker.ticker', {key: 1, color: color}) : null
        ]);
      }
    );
  });

  return {
    vtree$: vtree$,
    inject: function inject(model) {
      vtree$.inject(model.color$, model.tickerExists$);
      return model;
    }
  };
})();
```

# Inject as a side-effectful identity function

Inject is clearly an imperative procedure and an obvious creator of side effects. While
most of your code will look and be functional, inject is the most important mutative and
imperative piece in your code. Gladly, it's a rather simple one. You only need to call it
once, and it essentially just points each Stream to its dependencies. It is wise to have
one simple place in your code where you call the injects, and avoid dynamically injecting
depending on certain conditions or events.

Another aspect of inject is that it returns what was given to it.

-  `inject(a$)` returns `a$`
-  `inject(a$, b$, c$)` returns `[a$, b$, c$]`

This is in order to facilitate chaining a cycle of Streams. Instead of this:

```js
a$.inject(b$);
b$.inject(c$);
c$.inject(a$);
```

You can write this:

```js
a$.inject(b$).inject(c$).inject(a$);
```

This technique is particularly useful for the common Model-View-User-Intent architecture:

```
function model(i$) {
  // ...
}

function view(m$) {
  // ...
}

function user(v$) {
  // ...
}

function intent(i$) {
  // ...
}

let m$ = Cycle.createStream(model);
let v$ = Cycle.createStream(view);
let u$ = Cycle.createStream(user);
let i$ = Cycle.createStream(intent);

u$.inject(v$).inject(m$).inject(i$).inject(u$);
```
