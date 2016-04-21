<!-- This README.md is automatically generated from source code and files in the /markdown directory. Please DO NOT send pull requests to directly modify this README. Instead, edit the JSDoc comments in source code or the md files in /markdown/. -->

```text
          _
__  _____| |_ _ __ ___  __ _ _ __ ___
\ \/ / __| __| '__/ _ \/ _` | '_ ` _ \
 >  <\__ \ |_| | |  __/ (_| | | | | | |
/_/\_\___/\__|_|  \___|\__,_|_| |_| |_|
```
<h2 class="site-subtitle">An extremely intuitive, small, and fast<br />functional reactive stream library for JavaScript</h2>

- Only 26 core operators and factories
- Written in TypeScript
- Approximately 30 kB in size, without minification or gzip
- On average, faster than RxJS 4, Kefir, Bacon.js, as fast as RxJS 5, and slower than most.js
- Tailored for Cycle.js, or applications with limited use of `subscribe`

# Example

```js
import xs from 'xstream'

// Tick every second incremental numbers,
// only pass even numbers, then map them to their square,
// and stop after 5 seconds has passed

var stream = xs.periodic(1000)
  .filter(i => i % 2 === 0)
  .map(i => i * i)
  .endWhen(xs.periodic(5000).take(1))

// So far, the stream is idle.
// As soon as it gets its first listener, it starts executing.

stream.addListener({
  next: i => console.log(i),
  error: err => console.error(err),
  complete: () => console.log('completed'),
})
```

# Installation

```text
npm install xstream
```

# Usage

## ES2015 or TypeScript

```js
import xs from 'xstream'
```

## CommonJS

```js
var xs = require('xstream').default
```

# API

## Factories

- [`create`](#create)
- [`createWithMemory`](#createWithMemory)
- [`never`](#never)

## Methods and Operators

- [`addListener`](#addListener)
- [`removeListener`](#removeListener)
- [`map`](#map)
- [`mapTo`](#mapTo)
- [`shamefullySendNext`](#shamefullySendNext)
- [`shamefullySendError`](#shamefullySendError)
- [`shamefullySendComplete`](#shamefullySendComplete)

# Overview

XStream has four fundamental types: Stream, Listener, Producer, and MemoryStream.

## Stream

A Stream is an **event emitter** with multiple Listeners. When an event happens on the
Stream, it is broadcast to all its Listeners at the same time.

Streams have methods attached to them called *operators*, such as `map`, `filter`, `fold`, `take`, etc. When called, an operator creates and returns another Stream. The returned Stream is actually a Listener of the source Stream (I forgot to tell you that Streams may be Listeners, too). So once the source Stream broadcasts an event, the event will pass through the operator logic and the returned Stream may perhaps broadcast its own event based on the source one.

You can also trigger an event to happen on a Stream with the `shamefullySend*` methods. But you don't want to do that. Really, avoid doing that because it's not the reactive way and you'll be missing the point of this library. Ok?

## Listener

A Listener is an object with three functions attached to it: `next`, `error`, and `complete`. There is one function for each type of event a Stream may emit.

- `next` events are the typical type, they deliver a value.
- `error` events abort (stop) the execution of the Stream, and happen when something goes wrong in the Stream (or upstream somewhere in the chain of operators)
- `complete` events signal the peaceful stop of the execution of the Stream.

This is an example of a typical listener:

```js
var listener = {
  next: (value) => {
    console.log('The Stream gave me a value: ', value);
  },
  error: (err) => {
    console.error('The Stream gave me an error: ', err);
  },
  completed: () => {
    console.log('The Stream told me it is done.');
  },
}
```

And this is how you would attach that Listener to a Stream:

```js
stream.addListener(listener)
```

And when you think the Listener is done, you can remove it from the Stream:

```js
stream.removeListener(listener)
```

## Producer

A Producer is like a machine that produces events to be broadcast on a Stream.

Events from a Stream must come from somewhere, right? That's why we need Producers. They are objects with two functions attached: `start(listener)` and `stop()`. Once you call `start` with a `listener`, the Producer will start generating events and it will send those to the listener. When you call `stop()`, the Producer should quit doing its own thing.

Because Streams are Listeners, if you give a Stream as the Listener in `start(stream)`, essentially the Producer is now generating events that will be broadcast on the Stream. Nice, huh? Now a bunch of listeners can be attached to the Stream and they can all get those events originally coming from the Producer. That's why `xs.create(producer)` receives a Producer to be the heart of a new Stream. Check this out:

```js
var intervalProducer = {
  start: function (listener) {
    this.id = setInterval(() => listener.next('yo'), 1000)
  },

  stop: function () {
    clearInterval(this.id)
  },

  id: 0,
}

// This fellow delivers a 'yo' next event every 1 second
var stream = xs.create(producer)
```

But remember, a Producer has only one listener, but a Stream may have many listeners.

You may wonder "when is `start` and `stop` called", and that's actually a fairly tricky topic, so let's get back to that soon. First let me tell you about MemoryStreams.

## MemoryStream

A MemoryStream is just like a Stream: it has operators, it can have listeners attached, you can shamefully send events to it, blabla. But it has one special property: it has *memory*. It remembers the most recent (but just one) `next` event that it sent to its listeners.

Why is that useful? If a new Listener is added *after* that `next` event was sent, the MemoryStream will get its value stored in memory and will send it to the newly attached Listener.

This is important so MemoryStreams can represent values or pieces of state which are relevant even after some time has passed. You don't want to lose those, you want to keep them and send them to Listeners that arrive late, after the event was originally created.

## How a Stream starts and stops

A Stream controls its Producer according to its number of Listeners, using reference counting with a synchronous `start` and a cancelable asynchronous `stop`. That's how a Stream starts and stops, basically. Usually this part of XStream is not so relevant to remember when building applications, but if you want to understand it for debugging or curiosity, it's explained in plain English below.

When you create a Stream with `xs.create(producer)`, the `start()` function of the Producer is not yet called. The Stream is still "idle". It has the Producer, but the Producer was not turned on.

Once the first Listener is added to the Stream, the number of Listeners attached suddenly changed from `0` to `1`. That's when the Stream calls `start`, because after all there is at least one Listener interested in this Stream.

More Listeners may be added in the future, but they don't affect whether the Producer will continue working or stop. Just the first Listener dictates when the Stream starts.

What matters for stopping the Producer is `stream.removeListener`. When the last Listener leaves (or in other words, when the number of Listeners suddenly changes from `1` to `0`), the Stream schedules `producer.stop()` **to happen on the next event loop**. That is, asynchronously. If, however, a new Listener is added (number goes from `0` to `1`) *before* that scheduled moment, the `producer.stop()` will be cancelled, and the Producer will continue generating events for its Stream normally.

The reason the Producer is not suddenly (synchronously) stopped, is that it is often necessary to swap the single listener of a Stream, but still keep its ongoing execution. For instance:

```js
var listenerA = {/* ... */}
var listenerB = {/* ... */}

// number goes from 0 to 1, so the Stream's Producer starts
stream.addListener(listenerA)

// ...

// number goes from 1 to 0, but then immediately goes back
// to 1, because listenerB was added
stream.removeListener(listenerA)
stream.addListener(listenerB)

// Stream's Producer does not stop, everything continues as before
```

It's still useful to eventually (asynchronously) stop a Stream's internal Producer, because you don't want useless computation lying around producing gibberish. At least I don't.

# Factories

Factories are functions that create Streams, such as `xs.create()`, `xs.periodic()`, etc.

### <a id="create"></a> `create(producer)`

Creates a new Stream given a Producer.

#### Arguments:

- `producer: Producer` An optional Producer that dictates how to start, generate events, and stop the Stream.

#### Return:

*(Stream)* 

- - -

### <a id="createWithMemory"></a> `createWithMemory(producer)`

Creates a new MemoryStream given a Producer.

#### Arguments:

- `producer: Producer` An optional Producer that dictates how to start, generate events, and stop the Stream.

#### Return:

*(MemoryStream)* 

- - -

### <a id="never"></a> `never()`

Creates a Stream that does nothing when started. It never emits any event.

#### Return:

*(Stream)* 

- - -


# Methods and Operators

Methods are functions attached to a Stream instance, like `stream.addListener()`. Operators are also methods, but return a new Stream, leaving the existing Stream unmodified, except for the fact that it has a child Stream attached as Listener.

### <a id="addListener"></a> `addListener(listener)`

Adds a Listener to the Stream.

#### Arguments:

- `listener: Listener\<T>`

- - -

### <a id="removeListener"></a> `removeListener(listener)`

Removes a Listener from the Stream, assuming the Listener was added to it.

#### Arguments:

- `listener: Listener\<T>`

- - -

### <a id="map"></a> `map(project)`

Transform each event from the input Stream through a `project` function, to
get a Stream that emits those transformed events.

Marble diagram:
```text
--1---3--5-----7------
   map(i => i * 10)
--10--30-50----70-----
```

#### Arguments:

- `project: Function` A function of type `(t: T) => U` that takes event `t` of type `T` from the input Stream and produces an event of type `U`, to
be emitted on the output Stream.

#### Return:

*(Stream)* 

- - -

### <a id="mapTo"></a> `mapTo(projectedValue)`

It's like `map`, but transforms each input event to always the same
constant value on the output Stream.

Marble diagram:
```text
--1---3--5-----7-----
      mapTo(10)
--10--10-10----10----
```

#### Arguments:

- `projectedValue` A value to emit on the output Stream whenever the input Stream emits any value.

#### Return:

*(Stream)* 

- - -

### <a id="shamefullySendNext"></a> `shamefullySendNext(value)`

Forces the Stream to emit the given value to its listeners.

As the name indicates, if you use this, you are most likely doing something
The Wrong Way. Please try to understand the reactive way before using this
method. Use it only when you know what you are doing.

#### Arguments:

- `value` The "next" value you want to broadcast to all listeners of this Stream.

- - -

### <a id="shamefullySendError"></a> `shamefullySendError(error)`

Forces the Stream to emit the given error to its listeners.

As the name indicates, if you use this, you are most likely doing something
The Wrong Way. Please try to understand the reactive way before using this
method. Use it only when you know what you are doing.

#### Arguments:

- `error: any` The error you want to broadcast to all the listeners of this Stream.

- - -

### <a id="shamefullySendComplete"></a> `shamefullySendComplete()`

Forces the Stream to emit the "completed" event to its listeners.

As the name indicates, if you use this, you are most likely doing something
The Wrong Way. Please try to understand the reactive way before using this
method. Use it only when you know what you are doing.

- - -

