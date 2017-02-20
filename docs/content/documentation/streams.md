# Streams

## Reactive Programming

Reactivity is an important aspect in Cycle.js, and part of the core principles that led to the creation of this framework. There is a lot of confusion surrounding what Reactive means, so let's focus on that topic for a while.

Say you have a module Foo and a module Bar. A *module* can be considered to be an object of an [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) class, or any other mechanism of encapsulating state. Let's assume all code lives in some module. Here we have an arrow from Foo to Bar, indicating that Foo somehow affects state living inside Bar.

![modules foo bar](img/modules-foo-bar.svg)

A practical example of such arrow would be: *whenever Foo does a network request, increment a counter in Bar*. If all code lives in some module, **where does this arrow live?** Where is it defined? The typical choice would be to write code inside Foo which calls a method in Bar to increment the counter.

> Inside module Foo

```javascript
function onNetworkRequest() {
  // ...
  Bar.incrementCounter();
  // ...
}
```

Because Foo owns the relationship "*when network request happens, increment counter in Bar*", we say the arrow lives at the arrow tail, i.e., Foo.

![passive foo bar](img/passive-foo-bar.svg)

Bar is **passive**: it allows other modules to change its state. Foo is proactive: it is responsible for making Bar's state function correctly. The passive module is unaware of the existence of the arrow which affects it.

The alternative to this approach inverts the ownership of the arrow, without inverting the arrow's direction.

![passive foo bar](img/reactive-foo-bar.svg)

With this approach, Bar listens to an event happening in Foo, and manages its own state when that event happens. Bar is **reactive**: it is fully responsible for managing its own state by reacting to external events. Foo, on the other hand, is unaware of the existence of the arrow originating from its network request event.

> Inside module Bar

```javascript
Foo.addOnNetworkRequestListener(() => {
  self.incrementCounter(); // self is Bar
});
```

What is the benefit of this approach? It is Inversion of Control, mainly because Bar is responsible for itself. Plus, we can hide Bar's `incrementCounter()` as a private function. In the passive case, it was required to have `incrementCounter()` public, which means we are exposing Bar's internal state management outwards. It also means if we want to discover how Bar's counter works, we need to find all usages of `incrementCounter()` in the codebase. In this regard, Reactive and Passive seem to be dual to each other.

|                       | Passive                 | Reactive      |
|-----------------------|-------------------------|---------------|
| How does Bar work?    | *Find usages*           | Look inside   |

On the other hand, when applying the Reactive pattern, if you want to discover which modules are affected by an event in a Listenable module, you must find all usages of that event.

|                             | Proactive               | Listenable    |
|-----------------------------|-------------------------|---------------|
| Which modules are affected? | Look inside             | *Find Usages* |

Passive/Proactive programming has been the default way of working for most programmers in imperative languages. Sometimes the Reactive pattern is used, but sporadically. The selling point for widespread Reactive programming is to build self-responsible modules which focus on their own functionality rather than changing external state. This leads to Separation of Concerns.

The challenge with Reactive programming is this paradigm shift where we attempt to choose the Reactive/Listenable approach by default, before considering Passive/Proactive. After rewiring your brain to think Reactive-first, the learning curve flattens and most tasks become straightforward, especially when using a Reactive library like RxJS or *xstream*.

## What is a Stream?

Reactive programming can be implemented with: event listeners, [RxJS](http://reactivex.io/rxjs), [Bacon.js](http://baconjs.github.io/), [Kefir](https://rpominov.github.io/kefir/), [most.js](https://github.com/cujojs/most), [EventEmitter](https://nodejs.org/api/events.html), [Actors](https://en.wikipedia.org/wiki/Actor_model), and more. Even [spreadsheets](https://en.wikipedia.org/wiki/Reactive_programming) utilize the same idea of the cell formula defined at the arrow head. The above definition of Reactive programming is not limited to streams, and does not conflict with previous definitions of Reactive Programming. Cycle.js supports multiple stream libraries, such as [RxJS](http://reactivex.io/rxjs), [xstream](http://staltz.com/xstream), and [most.js](https://github.com/cujojs/most), but by default we choose *xstream* because it was custom built for Cycle.js.

In short, a *Stream* in *xstream* is an event stream which can emit zero or more events, and may or may not finish. If it finishes, then it does so by either emitting an error or a special "complete" event.

> Stream contract

```
(next)* (complete|error){0,1}
```

As an example, here is a typical Stream: it emits some events, then it eventually completes.

![completed stream](img/completed-stream.svg)

Streams can be listened to, just like EventEmitters and DOM events can. Notice there are 3 handlers: one for events, one for errors, and one for "complete".

```javascript
myStream.addListener({
  next: function handleNextEvent(event) {
    // do something with `event`
  },
  error: function handleError(error) {
    // do something with `error`
  },
  complete: function handleCompleted() {
    // do something when it completes
  },
});
```

*xstream* Streams become very useful when you transform them with the so-called *operators*, pure functions that create new Streams on top of existing ones. Given a Stream of click events, you can easily make a Stream of the number of times the user clicked.

> Operators

```javascript
const clickCountStream = clickStream
  // each click represents "1 amount"
  .mapTo(1)
  // sum all events `1` over time, starting from 0
  .fold((count, x) => count + x, 0);
```

[Succinctness is Power](http://www.paulgraham.com/power.html), and *xstream* operators demonstrate that you can achieve a lot with a few well-placed operators. With only about [26 operators](https://github.com/staltz/xstream#methods-and-operators), you can build almost all programming patterns needed in a Cycle.js app.

Knowing the basics of reactive streams programming is a prerequisite to getting work done with Cycle.js. Instead of teaching RxJS or *xstream* on this site, we recommend a few great learning resources, in case you need to learn more. *xstream* is similar to *RxJS*, so these resources apply:

- [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754): a thorough introduction to RxJS by Cycle.js author Andre Staltz.
- [Introduction to Rx](http://introtorx.com/): an online book focused on Rx.NET, but most concepts map directly to RxJS.
- [ReactiveX.io](http://reactivex.io/): official cross-language documentation site for ReactiveX.
- [Learn Rx](http://reactivex.io/learnrx/): an interactive tutorial with arrays and Observables, by Jafar Husain.
- [RxJS lessons at Egghead.io](https://egghead.io/technologies/rx)
- [RxJS GitBook](http://xgrommx.github.io/rx-book/)
- [RxMarbles](http://rxmarbles.com/): interactive diagrams of RxJS operators, built with Cycle.js.
- [Async JavaScript at Netflix](https://www.youtube.com/watch?v=XRYN2xt11Ek): video of Jafar Husain introducing RxJS.

## Streams in Cycle.js

Now we are able to explain the types of `senses` and `actuators`, and what it means for the computer and human to be "mutually observed."

In the simplest case, the computer generates pixels on the screen, and the human generates mouse and keyboard events. The computer observes these user inputs and the human observes the screen state generated by the computer. Notice that we can model each of these as *Streams*:

- Computer's output: a stream of screen images.
- Human's output: a stream of mouse/keyboard events.

The `computer()` function takes the human's output as its input, and vice versa. They mutually observe each other's output. In JavaScript, we could write the computer function as a simple chain of *xstream* transformations on the input stream.

```javascript
function computer(userEventsStream) {
  return userEventsStream
    .map(event => /* ... */)
    .filter(someCondition)
    .map(transformItToScreenPixels)
    .flatten();
}
```

While doing the same with the `human()` function would be elegant, we cannot do that as a simple chain of operators because we need to leave the JavaScript environment and affect the external world. While conceptually the `human()` function can exist, in practice, we need to use *driver* functions in order to reach the external world.

[Drivers](drivers.html) are adapters to the external world, and each driver represents one aspect of external effects. For instance, the DOM Driver takes a "screen" Stream generated by the computer, and returns Streams of mouse and keyboard events. In between, the DOM Driver function produces "*write*" side effects to render elements on the DOM, and catches "*read*" side effects to detect user interaction. This way, the DOM Driver function can act on behalf of the user. The name "driver" is based off Operating System drivers, which have a similar kind of role: to create a bridge between devices and your software.

Joining both parts, we have a computer function, often called `main()`, and a driver function, where the output of one is the input of the other.

```
y = domDriver(x)
x = main(y)
```

The circular dependency above cannot be solved if `=` means assignment, because that would be equivalent to the command `x = g(f(x))`, and `x` is undefined on the right-hand side.

This is where Cycle.js comes in: you only need to specify `main()` and `domDriver()`, and give it to the Cycle.js `run()` command which connects them circularly.

```javascript
function main(sources) {
  const sinks = {
    DOM: // transform sources.DOM through
         // a series of xstream operators
  };
  return sinks;
}

const drivers = {
  DOM: makeDOMDriver('#app') // a Cycle.js helper factory
};

run(main, drivers); // solve the circular dependency
```

This is how the name "*Cycle.js*" came to be. It is a framework that solves the cyclic dependency of streams which emerge during dialogues (mutual observations) between the Human and the Computer.

Next, read the [basic examples](basic-examples.html) which apply what we've learned so far about Cycle.js.