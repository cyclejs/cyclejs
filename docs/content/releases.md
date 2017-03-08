# Flexible isolation

This applies to the following versions and above:

| package | version | changelog |
|---|---|---|
| `@cycle/dom` | 16.0.0 | [changelog](https://github.com/cyclejs/cyclejs/blob/master/dom/CHANGELOG.md#1600-2017-03-08) |
| `@cycle/http` | 13.1.0 | [changelog](https://github.com/cyclejs/cyclejs/blob/master/http/CHANGELOG.md#1310-2017-03-08) |
| `@cycle/isolate` | 2.1.0 | [changelog](https://github.com/cyclejs/cyclejs/blob/master/isolate/CHANGELOG.md#210-2017-03-08) |

Packages `@cycle/isolate`, `@cycle/dom`, `@cycle/http` were updated to provide more options when isolating components.

## isolate

The scope argument to `isolate(component, scope)` can now be an object called "scopes per channel" which allows you to give multiple different scopes:

```js
const childSinks = isolate(Child, {DOM: 'foo', HTTP: 'bar'})(sources);
```

You can also use a wildcard `'*'` to use as a default for source/sinks channels that did not receive a specific scope:

```js
// Uses 'bar' as the isolation scope for HTTP and other channels
const childSinks = isolate(Child, {DOM: 'foo', '*': 'bar'})(sources);
```

If you don't have a wildcard and some channels are unspecified, then `isolate` will generate a random scope.

```js
// Uses some arbitrary string as the isolation scope for HTTP and other channels
const childSinks = isolate(Child, {DOM: 'foo'})(sources);
```

## Cycle DOM

As an additional feature, Cycle DOM recognizes special scope strings: `':root'` as the scope will apply no isolation, and `'.foo'` or `'#foo'` will apply isolation between sibling components.

In the example below, a `sources.DOM.select()` call will have access to the DOM trees in both foo and bar children (which means there is no parent-child isolation). However, a `sources.DOM.select()` inside `Child` foo will have no access to the DOM trees in `Child` bar (which means between-siblings isolation).

```js
function Parent(sources) {
  const fooChildSinks = isolate(Child, {DOM: '.foo', '*': 'f'})(sources);
  const barChildSinks = isolate(Child, {DOM: '.bar', '*': 'b'})(sources);

  // ...
}
```

## Cycle HTTP

Similarly, Cycle HTTP now has a way of detecting a special scope to mean "no isolation". Just pass `null` as the scope, and no isolation will be applied.

```js
function Parent(sources) {
  const childSinks = isolate(Child, {HTTP: null})(sources);

  // ...
}
```

The Child component will have access to all responses for the Parent component, because there is no isolation, they are in the same isolation context.

For more discussion on the motivation and development of these features, read [issue 526](https://github.com/cyclejs/cyclejs/issues/526).

# Cycle Unified

> 2017-02-09

**_TL;DR: Cycle Unified is a large refactor with only a few small breaking changes, plus plenty of bug fixes and support for TypeScript 2.1._**

After lots of work (just look at this very long [to-do list](https://github.com/cyclejs/cyclejs/issues/425#issue-175112954)), we (@staltz, @TylorS, @Widdershin) are proud to announce the next significant version of Cycle.js, called *Unified*. While this is not a "changes everything" release, it has some important details that we want to bring to your attention, so that migration happens smoothly and everyone stays happy.

**Highlights:**

- Dropped stream adapters, now using [ES Observable](https://github.com/tc39/proposal-observable) to convert between stream libraries
- Dropped [RxJS v4](https://github.com/Reactive-Extensions/RxJS/) support, while still supporting [RxJS v5](http://reactivex.io/rxjs/)
- Made xstream the default stream library (but not the only!) for Cycle.js
- Renamed `@cycle/xstream-run` to `@cycle/run`
- Added support for [TypeScript 2.1](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-1.html)
- Included many bug fixes to Cycle DOM
- Dropped transposition feature in Cycle DOM
- Updated Cycle History significantly with breaking changes

## Packages

You are using Cycle Unified whenever you use these packages with the following version numbers or higher:

| package | version |
|---|---|
| `xstream` | 10.0.0 |
| `rxjs` | 5.0.0 |
| `most` | 1.2.0 |
| `@cycle/run` | 1.0.0 |
| `@cycle/rxjs-run` | 4.0.0 |
| `@cycle/most-run` | 5.0.0 |
| `@cycle/dom` | 15.0.0 |
| `@cycle/http` | 12.0.0 |
| `@cycle/history` | 5.0.0 |
| `@cycle/isolate` | 2.0.0 |
| `@cycle/jsonp` | 7.0.0 |

## Motivation

When we built [Cycle Diversity](#cycle-diversity), the purpose was to extend Cycle.js to support more stream libraries such as RxJS v5, xstream, most.js. At that time, we had to create our own mechanism for converting streams of different types between these libraries. That mechanism was **Adapters**. Each stream library had its corresponding adapter package, e.g. `@cycle/rxjs-adapter`, `@cycle/xstream-adapter`.

Today, there is a more reliable conversion mechanism between stream libraries, which is compliance with the [ECMAScript proposal for Observables for the Web](https://github.com/tc39/proposal-observable). Libraries such as RxJS v5, Most.js, xstream, Kefir, all have from/to conversion with ES Observable.

This made our adapters mostly unnecessary, and motivated a refactor of Cycle.js to make use of ES Observable as the conversion mechanism. This would bring some breaking changes, so we decided to include other breaking changes into the next version of Cycle.js, so you won't have to read migration guides too often. Even with breaking changes, our goal was to preserve compatibility with most of your existing code written with Cycle Diversity.

The next version is called "Unified" to reflect how stream libraries are becoming interoperable with less effort. For instance, you can use an RxJS observable in a Cycle app written mostly with xstream, as long as you convert with `xs.fromObservable(myRxObservable)`.

Other breaking changes that we included besides the removal of adapters are: TypeScript 2.1 (breaking change compared to v2.0) support, overhaul of Cycle History with breaking changes, removal of transposition in Cycle DOM, etc.

## New features

- Support for TypeScript 2.1 across all packages
- Updated Snabbdom from v0.5.0 to v0.6.4, which includes many new features (read their [release notes](https://github.com/snabbdom/snabbdom/releases/))
- HTML driver in Cycle DOM can take custom Snabbdom modules [#335](https://github.com/cyclejs/cyclejs/issues/335)
- DOM Driver supports Snabbdom dataset module by default [#396](https://github.com/cyclejs/cyclejs/issues/396)
- Cycle History updated to use ReactTraining/history v4.5
- Cycle HTTP updated to use Superagent v3.4
- `@cycle/most-run` updated to support Most.js v1.2

## Bug fixes

#### Cycle Run (for any stream library)

- Fix (memory) resource disposal to be more reliable
- Fix race condition for drivers that subscribe late, such as [in Cycle DOM](https://github.com/cyclejs/cyclejs/pull/516/commits/58b7991a19b47ff8589ead7df1f5131605a28916)
- Delay sink completion until `dispose()`
  - From a driver's perspective, the given sink will only complete once `dispose()` is called, not before, even if from `main`'s perspective the sink stream completes early. This fixes race conditions with drivers that subscribe late versus sinks that complete early.

#### Cycle DOM

- Updated Snabbdom from v0.5.0 to v0.6.4, which fixed several bugs in Cycle DOM, check their [release notes]
- Fix support for DOMSource.elements() in an isolated `main()`, issue [#310](https://github.com/cyclejs/cyclejs/issues/310)
- Fix report of errors thrown in Snabbdom hooks, issue [#414](https://github.com/cyclejs/cyclejs/issues/414)
- Only start patching the DOM after the DOM is ready, issue [#222](https://github.com/cyclejs/cyclejs/issues/222)
- Fix client-side rendering to consider existing DOM (rendered from the server-side), Snabbdom issue [#167](https://github.com/snabbdom/snabbdom/issues/167)

#### Cycle HTTP

- Updated Superagent from v2.3 to v3.4, which fixed several bugs in Cycle HTTP, check their [release notes](https://github.com/visionmedia/superagent/releases)

#### Cycle History

- Updated ReactTraining/history from v3.0 to v4.5, which fixed several bugs in Cycle History, check their [release notes](https://github.com/ReactTraining/history/blob/master/CHANGES.md)

#### isolate

- Fix TypeScript typings for `isolate` to accept any sources. Relaxes type restrictions so that isolate can be used without casting arguments to `any`, since TypeScript's inference is weak in the use cases for `isolate`.

## Breaking changes

**Dropped support for TypeScript 2.0**: if you are using TypeScript, then Cycle Unified cannot be used with TypeScript 2.0, it only supports v2.1 or higher. This is because TypeScript v2.1 has breaking changes compared to TypeScript v2.0. If you are using JavaScript, this will not affect you in any way.

**Dropped support for RxJS v4**: this means `@cycle/rx-run` and `@cycle/rx-adapter` no longer exist. Cycle.js does not anymore officially support the npm package `rx`. We encourage you to migrate to the newer, faster version `rxjs`, and the corresponding `@cycle/rxjs-run`.

**Renamed `@cycle/xstream-run` to `@cycle/run`**: now that xstream is the engine powering Cycle.js, it is also the default stream library to use if you are unsure which one to pick. If you are using xstream, use `@cycle/run`. This also means that even if you use `@cycle/rxjs-run` or `@cycle/most-run`, you will still indirectly import `@cycle/run` since it is the engine used underneath. All Cycle.js apps will have `@cycle/run`.

**Dropped support for transposition in Cycle DOM**: transposition was a feature that enabled you to pass "streams of VDOM" as children in the VDOM tree, and it would be *magically* expanded over time in the resulting rendering. After extensive trial in real-world usage, we concluded that transposition is misaligned with Cycle.js' design goals of "explicit over magical".

**Dropped adapters**: packages `@cycle/xstream-adapter`, `@cycle/rx-adapter`, `@cycle/rxjs-adapter`, `@cycle/most-adapter` no longer exist.

**Drivers no longer take an adapter as the second argument**: there is no longer the convention of passing a stream adapter as the second argument. This means that drivers need to be updated otherwise they won't work for Cycle Unified. More instructions about this for library authors are below.

**Sink streams given to drivers are always an xstream stream**: the conversion to another stream library must be done manually in the driver. This is important for driver authors.

**Cycle Run and completion of sinks may behave differently**: see above about race conditions fixed in Cycle Run. Once you upgrade to Cycle Unified, your application may possible behave differently, in case you were unknowingly relying on buggy behavior. The new behavior is more reliable.

## Migration guide

Quick examples:

- If you are using xstream and TypeScript, this is the best example: https://github.com/staltz/matrixmultiplication.xyz/commit/517194366768f52766756a7bf9255eeba395caf5
- If you are using RxJS and JavaScript, this is a good example: https://github.com/cyclejs/cyclejs/pull/516/commits/dd84a6c46ee7c0512e481eb7967210413c8c4272

### Cycle xstream Run

See the diff below to see what you should replace. `-` is before migration, `+` is after migration.

```diff
-import Cycle from '@cycle/xstream-run';
+import {run} from '@cycle/run';

 // ...

-Cycle.run(main, {
+run(main, {
   // drivers here
 });
```

### Cycle RxJS v5 Run

See the diff below to see what you should replace. `-` is before migration, `+` is after migration.

```diff
-import Cycle from '@cycle/rxjs-run';
+import {run} from '@cycle/rxjs-run';

 // ...

-Cycle.run(main, {
+run(main, {
   // drivers here
 });
```

### Cycle RxJS v4 Run

See the diff below to see what you should replace. `-` is before migration, `+` is after migration.

```diff
-import Cycle from '@cycle/rx-run';
-import * as Rx from 'rx';
+import {run} from '@cycle/rxjs-run';
+import * as Rx from 'rxjs';

 // ...

-Cycle.run(main, {
+run(main, {
   // drivers here
 });
```

### Cycle Most Run

See the diff below to see what you should replace. `-` is before migration, `+` is after migration.

```diff
-import Cycle from '@cycle/most-run';
+import {run} from '@cycle/most-run';

 // ...

-Cycle.run(main, {
+run(main, {
   // drivers here
 });
```

### Cycle DOM

**BEFORE:** with transposition, you could do this (notice a stream as a child in the VDOM tree):

```js
function view(state$) {
  return state$.map(state =>
    div('.article', [
      h2('.title', state.articleTitle),
      xs.periodic(1000).startWith(0).map(x =>
        div('.seconds', `${x} seconds passed`)
      )
    ])
  );
}
```

**AFTER:** transposition support was dropped, so you have to do this instead:

```js
function view(state$) {
  const x$ = xs.periodic(1000).startWith(0);
  return xs.combine(state$, x$).map(([state, x]) =>
    div('.article', [
      h2('.title', state.articleTitle),
      div('.seconds', `${x} seconds passed`)
    ])
  );
}
```

Here is a diff of before/after:

```diff
 function view(state$) {
-  return state$.map(state =>
+  const x$ = xs.periodic(1000).startWith(0);
+  return xs.combine(state$, x$).map(([state, x]) =>
     div('.article', [
       h2('.title', state.articleTitle),
-      xs.periodic(1000).startWith(0).map(x =>
         div('.seconds', `${x} seconds passed`)
-      )
     ])
   );
 }
```

### Cycle History

**In Node.js**: see the diff below to see what you should replace. `-` is before migration, `+` is after migration.

```diff
-import {makeHistoryDriver, createServerHistory} from '@cycle/history';
+import {createServerHistoryDriver} from '@cycle/history';

-const history = createServerHistory();

 run(main, {
-  history: makeHistoryDriver(history),
+  history: createServerHistoryDriver({initialUrls: [req.url]}),
 });

-history.push(req.url);
```

**In browsers, using the HTML5 API, and "capture clicks" turned OFF**:

```diff
-import {makeHistoryDriver} from '@cycle/history';
-import {createHistory} from 'history';
+import {makeHistoryDriver} from '@cycle/history';

 run(main, {
-  history: makeHistoryDriver(createHistory),
+  history: makeHistoryDriver(),
 });
```

**In browsers, using the HTML5 API, and "capture clicks" turned ON**:

```diff
-import {makeHistoryDriver} from '@cycle/history';
-import {createHistory} from 'history';
+import {makeHistoryDriver, captureClicks} from '@cycle/history';

 run(main, {
-  history: makeHistoryDriver(createHistory, {capture: true}),
+  history: captureClicks(makeHistoryDriver()),
 });
```

**In browsers, using hash-based history**:

```diff
-import {makeHistoryDriver} from '@cycle/history';
-import {createHashHistory} from 'history';
+import {makeHashHistoryDriver} from '@cycle/history';

 run(main, {
-  history: makeHistoryDriver(createHashHistory()),
+  history: makeHashHistory(),
 });
```

## For library authors

### Driver authors

If you have a driver library, you definitely will need to update carefully for Cycle Unified. Highlights are:

- Driver functions no longer take a stream adapter as the second argument
- A driver function `myDriver` no longer need to set the property `myDriver.streamAdapter`
- All sink streams are `xstream` streams
- Sources must be converted using `adapt()` before they are returned
- Must have `"@cycle/run": "*"` in package.json dependencies

**Adapt()** is a new feature in Cycle Unified which replaces adapters. It can be imported with `import {adapt} from '@cycle/run/lib/adapt'` and its type signature is:

```typescript
function adapt<T>(stream: xs.Stream<any>): T;
```

where `T` is a stream/Observable from the library being used in `@cycle/___-run`. For example, if the user is using `@cycle/rxjs-run`, then `adapt()` from `@cycle/run/lib/adapt` will have the type signature:

```typescript
function adapt(stream: xs.Stream<any>): Observable<any>;
```

In other words, use `adapt()` whenever you want to convert from xstream to "The Stream Type `foo` from `@cycle/foo-run`". When the user is using xstream and `@cycle/run`, then `adapt()` is just the identity function `x => x`.

Below is a diff of before/after on a simple driver that **returns a stream as the source**:

```diff
-import XStreamAdapter from '@cycle/xstream-adapter';
+import {adapt} from '@cycle/run/lib/adapt';

 function makeMyDriver(options) {
-  function myDriver(sink$, streamAdapter, name) {
+  function myDriver(sink$, name) {
     // ...
     const source$ = // ...
-    return source$;
+    return adapt(source$);
   }
-  myDriver.streamAdapter = XStreamAdapter;
   return myDriver;
 }
```

Below is a diff of before/after on a simple driver that **returns a complex source object**:

```diff
-import XStreamAdapter from '@cycle/xstream-adapter';
+import {adapt} from '@cycle/run/lib/adapt';

 function makeMyDriver(options) {
-  function myDriver(sink$, runStreamAdapter, name) {
+  function myDriver(sink$, name) {
     // ...
     const source = {
       select(query) {
         const response$ = // ...
-        return runStreamAdapter.adapt(response$, XStreamAdapter.streamSubscribe);
+        return adapt(response$);
       },
     };
     return source;
   }
-  myDriver.streamAdapter = XStreamAdapter;
   return myDriver;
 }
```

We recommend to write drivers with `xstream` since it's the smallest stream library. If you use another stream library to write your driver, pay attention that `sink$` is always from xstream, so you may need to convert, e.g. `most.from(sink$)` or `Rx.Observable.from(sink$)`.

### Utility authors

If you author a utility library (for instance, [Onionify](https://github.com/staltz/cycle-onionify/) or [Sortable](https://github.com/cyclejs-community/cyclejs-sortable)), the rationale is similar than that for drivers.

Usually utility libraries will also take streams as input and return streams. Internally, the utility library must convert the input stream (note that this time it may be of any stream library, unlike sinks that are always from xstream) using "fromESObservable" or equivalent. Before returning the output stream, use `adapt()` to convert to the stream library your library user was using.

## Questions?

You're welcome in [our chat at Gitter](https://gitter.im/cyclejs/cyclejs) to make migration questions. :)

# Cycle Diversity

> 2016-06-27

**_Full support for TypeScript and multiple stream libraries_**

Today we are releasing Cycle Diversity, the next big version of Cycle.js, after months of continuous development. The highlights of this release are:
- Support for **multiple stream libraries**: [RxJS v4](https://github.com/Reactive-Extensions/RxJS), [RxJS v5](http://reactivex.io/rxjs/), [most.js](https://github.com/cujojs/most), [xstream](http://staltz.com/xstream/)
- **xstream** is a stream library custom built for Cycle.js
- Rewritten entirely in **TypeScript**, so all type definitions are accurate and up-to-date
- Cycle DOM rewritten in [**Snabbdom**](https://github.com/paldepind/snabbdom/): faster performance, better lifecycle hooks API, smaller kB footprint
- Cycle DOM isolation rewritten, does not depend anymore on classNames
- Cycle HTTP has a better, simpler API with `HTTPSource.select(category)`

Because Cycle.js is split in packages, the packages and their versions which constitute "Cycle Diversity" are:

- `@cycle/rx-run` or `@cycle/core` v7.0.0 or greater
- `@cycle/rxjs-run` v3.0.0 or greater
- `@cycle/most-run` v3.0.0 or greater
- `@cycle/xstream-run` v3.0.0 or greater
- `@cycle/dom` v10.0.0 or greater
- `@cycle/http` v9.0.0 or greater
- `@cycle/jsonp` v6.0.0 or greater
- `@cycle/storage` v3.0.0 or greater

Development of Cycle Diversity started 5 months ago, when [Tylor](https://github.com/tylors) and [Andre](https://github.com/staltz) had decided to merge the two projects Cycle.js and [Motorcycle.js](https://github.com/motorcyclejs). The goal was to allow a Cycle.js user (with RxJS) to write their app as normally, while utilizing a Motorcycle.js driver (written in most.js), and vice-versa. This lead to the creation of a "Cycle.run" package for each stream library `@cycle/rx-run` and `@cycle/most-run`. Each of these run functions knows how to convert the streams from drivers (potentially written with other stream libraries). This also made it possible to create Cycle.run for other stream libraries like the recent RxJS v5, which now has `@cycle/rxjs-run`.

Since Cycle Diversity is not anymore centralized around RxJS, this opened up the possibility to build a stream library meant specifically for Cycle.js. Four months ago, Andre and Tylor started experiments, which culminated in the creation of [xstream](http://staltz.com/xstream/). The highlights of xstream are: (1) all streams are hot (since cold/hot distinction has been a major pain point for Cycle.js users), (2) only a few operators to choose from (making it easier to learn and choose operators), (3) fast performance and very small kB footprint. Particularly the third reason makes xstream suitable for driver libraries. All official drivers are now written with xstream, and we recommend using xstream also for Cycle.js users building apps. We will keep supporting libraries like RxJS and most.js, but xstream is the future of Cycle.js and Cycle.js is the future of xstream.

While rewriting the entire Cycle.js infrastructure for multiple stream libraries, we also used the opportunity to do the rewrite in TypeScript. Plenty of users have previously asked for TypeScript support. Now that the source code itself is in TypeScript, the type definitions are guaranteed to always be up-to-date. We also warmly recommend JavaScript programmers to give TypeScript plus Cycle.js a try. It is easy to set up, and makes the development experience smoother, as you can notice mistakes as soon as possible. We also provide a couple of examples.

Last but not least, Motorcycle.js had a DOM Driver based on Snabbdom, and people have found it to be better than virtual-dom. Snabbdom is faster, smaller, and has an API for hooks which is based on simple functions, not on classes, besides being extensible with Snabbdom modules. We took the best ideas of that DOM Driver with Snabbdom and we rewrote the official Cycle.js with Snabbdom and TypeScript. During this process, we ended up fixing several bugs the previous DOM Driver had, like [#226](https://github.com/cyclejs/cyclejs/issues/226), [#227](https://github.com/cyclejs/cyclejs/issues/227), [#229](https://github.com/cyclejs/cyclejs/issues/229), [#288](https://github.com/cyclejs/cyclejs/issues/288), [#291](https://github.com/cyclejs/cyclejs/issues/291), [#306](https://github.com/cyclejs/cyclejs/issues/306). The new Cycle DOM v10 is very solid, tested, fast, fully supports TypeScript, and has some API improvements.

Below you will find some guides on how to migrate to Cycle Diversity. We cover issues like:
- Using the new `@cycle/____-run` packages instead of `@cycle/core`
- Migrating from RxJS to xstream (**optional but recommended**)
- Migrating from virtual-dom (Cycle DOM v9) to Snabbdom (Cycle DOM v10)

## Migration guide

The most important thing to know for all applications is that there are now multiple "Cycle Core" packages:

| Before | After |
| --- | --- |
| `@cycle/core` | `@cycle/rx-run` or `@cycle/core` |
| - | `@cycle/xstream-run` |
| - | `@cycle/rxjs-run` |
| - | `@cycle/most-run` |

If you npm install the `____-run` package for a stream library, you must also npm install that stream library separately

| Package | Must also install |
| --- | --- |
| `@cycle/rx-run` | `rx` |
| `@cycle/xstream-run` | `xstream` |
| `@cycle/rxjs-run` | `rxjs` |
| `@cycle/most-run` | `most` |

For instance, in your package.json:

``` js
  "dependencies": {
    "@cycle/rxjs-run": "3.0.0",
    "rxjs": "^5.0.0-beta.8"
  },
```

**Drivers may use a stream library different to the one you're using.** Pay attention to the requirements that each driver has regarding the stream library they are using. It is usually an npm peer dependency and will show in your terminal when you `npm install`. However, you can assume that most official drivers use `xstream`.

For instance, if you install Cycle DOM or Cycle HTTP, you must also install `xstream`:

``` diff
   "dependencies": {
     "@cycle/rxjs-run": "3.0.0",
     "rxjs": "^5.0.0-beta.8",
+    "@cycle/dom": "^10.0.0",
+    "xstream": "^5.0.6"
   },
```

**When the stream library, `run`, and drivers are installed, using them together is basically like before:**

``` diff
-import Cycle from '@cycle/core';
+import {run} from '@cycle/rxjs-run';
 import {makeDOMDriver} from '@cycle/dom';

 // ...

-Cycle.run(main, {
+run(main, {
   DOM: makeDOMDriver('#app'),
 });
```

## From RxJS to xstream (optional)

If you choose to use xstream but have an existing application written in RxJS, here are some hints that may help you convert the code.

| RxJS | xstream |
| --- | --- |
| Cold by default | Hot only |

The biggest difference between RxJS and xstream is the cold/hot issue. When migrating, you will notice this by how you won't need to `.share()` in xstream code. There is no `.share()` in xstream because all streams are already "shared".

Sometimes, though, a chain of cold streams in RxJS won't "work" when converted to xstream. This happens specially if you have a Y-shaped dependency. For instance:

`a$ -> b$ -> c$`
and
`a$ -> b$ -> d$`

where all of these are cold. The most common case for this is where `b$` is a `state$`, returned from a `model()` function. In RxJS, the entire chain is cold, so there are actually **two separate** executions of `b$`, and that's why both `c$` and `d$` get incoming events.

In xstream, there would be just one shared execution of `b$`, and if it sent out an initial value, only the first chain with `c$` would see it, while `d$` would miss it. This will happen if `b$` has a `.startWith()` or something similar, which emits an initial event synchronously. Usually this is solved by the equivalent of `.shareReplay()` in xstream, which is called `.remember()`. This operator returns a [MemoryStream](https://github.com/staltz/xstream#memorystream), which is like an RxJS ReplaySubject.

**As a rule of thumb, if a stream represents a "value over time", you should make sure to apply .remember() to make it a MemoryStream.** You can do this for every stream that acts like a "value over time" in your code. You don't need to wait for a bug to happen to only then apply `remember()`. A "value over time" is different to an event stream because at any point in time you always expect some value to exist. An example of a "value over time" is a person's age, while an example of an event stream is a person's birthday events. Every living person has an _age value_ at any point in time. However, there is no point in talking about "your current birthday", because these are just a stream of events that happen periodically every year. It's possible to convert from one to the other, though: `age$ = birthday$.remember()`. A typical "value over time" in a Cycle.js app is `state$`, so make sure these are defined with `.remember()` in the end.

| RxJS | xstream |
| --- | --- |
| `.shareReplay(1)` | `.remember()` |

Those are the largest obstacles. Otherwise, the operator API in xstream is well compatible with RxJS. Compare these:

| RxJS | xstream |
| --- | --- |
| `.map(x => x * 10)` | `.map(x => x * 10)` |
| `.map(10)` | `.mapTo(10)` |
| `.filter(x => x === 1)` | `.filter(x => x === 1)` |
| `.take(1)` | `.take(1)` |
| `.last()` | `.last()` |
| `.startWith('init')` | `.startWith('init')` |
| `Observable.never()` | `xs.never()` |
| `Observable.empty()` | `xs.empty()` |
| `Observable.throw(err)` | `xs.throw(err)` |
| `Observable.of(1, 2, 3)` | `xs.of(1, 2, 3)` |
| `Observable.merge(a$, b$, c$)` | `xs.merge(a$, b$, c$)` |
| `Observable.fromPromise(p)` | `xs.fromPromise(p)` |

Some operators and methods, though, are slightly different or have different names:

| RxJS | xstream |
| --- | --- |
| `Observable.interval(1000)` | `xs.periodic(1000)` |
| `.subscribe(observer)` | `.addListener(listener)` |
| `subscription.unsubscribe()` | `.removeListener(listener)` |
| `.skip(3)` | `.drop(3)` |
| `.takeUntil(b$)` | `.endWhen(b$)` |
| `.catch(fn)` | `.replaceError(fn)` |
| `.do(fn)` | `.debug(fn)` |
| `.let(fn)` | `.compose(fn)` |
| `.scan(fn, seed)` | `.fold(fn, seed)` |
| `Observable.combineLatest` | `xs.combine` |
| `switch` | `flatten` |
| `mergeAll` | `flattenConcurrently` |
| `concatAll` | `flattenSequentially` |
| Subject `onNext` | `shamefullySendNext` |
| Subject `onError` | `shamefullySendError` |
| Subject `onComplete` | `shamefullySendComplete` |

It's very important to note the difference between `scan` and `fold` is not just naming. xstream `fold` has `startWith(seed)` embedded internally. So xstream `a$.fold((acc, x) => acc + x, 0)` is equivalent to RxJS `a$.startWith(0).scan((acc, x) => acc + x)`. We noticed that in most cases where RxJS scan was used in Cycle.js apps, it was preceded by `startWith`, so we built `fold` so that it has both together. If you don't want the seed value emitted initially, then just apply `.drop(1)` after `fold`.

| RxJS | xstream |
| --- | --- |
| `a$.startWith(0).scan((acc, x) => acc + x)` | `a$.fold((acc, x) => acc + x, 0)` |

**combineLatest** in xstream is a bit different. It's called `combine`, and only takes streams as arguments. The output of combine is an **array** of values, so it usually requires a `map` operation after `combine` to take the array of values and apply a transformation. It's usually a good idea to use ES2015 array destructuring on the parameter of the transformation function. E.g. `.map(([a,b]) => a+b)` not `.map(arr => arr[0] + arr[1])`.

| RxJS | xstream |
| --- | --- |
| `Observable.combineLatest(a$, b$, (a,b) => a+b))` | `xs.combine(a$, b$).map(([a,b]) => a+b)` |

Also important to note that xstream has no `flatMap` nor `flatMapLatest`/`switchMap`, but instead you should apply two operators: `map` + `flatten` or `map` + `flattenConcurrently`:

``` js
// RxJS
var b$ = a$.flatMap(x =>
  Observable.of(x+1, x+2)
);

// xstream
var b$ = a$.map(x =>
  xs.of(x+1, x+2)
).compose(flattenConcurrently);
```

``` js
// RxJS
var b$ = a$.flatMapLatest(x =>
  Observable.of(x+1, x+2)
);

// xstream
var b$ = a$.map(x =>
  xs.of(x+1, x+2)
).flatten();
```

Pay careful attention to the difference in naming:

| RxJS | xstream |
| --- | --- |
| flatMapLatest | map + flatten |
| flatMap | map + flattenConcurrently |
| concatMap | map + flattenSequentially |

**If you were using the Proxy Subject technique in Cycle.js for building circularly dependent Observables**, _xstream_ makes that easier with `imitate()`, built in the library specifically for circularly dependent streams:

``` diff
-var proxy$ = new Rx.Subject();
+var proxy$ = xs.create();
 var childSinks = Child({DOM: sources.DOM, foo: proxy$});
-childSinks.actions.subscribe(proxy$);
+proxy$.imitate(childSinks.actions);
```

For more information on xstream, check the [documentation](https://github.com/staltz/xstream).

## New Cycle DOM APIs

Cycle DOM Driver has slightly new APIs.

| Cycle DOM v9 | Cycle DOM v10 |
| --- | --- |
| `DOMSource.select().observable` | `DOMSource.select().elements()` |
| `makeDOMDriver(container, {onError: fn})` | `makeDOMDriver(container)` |
| `makeDOMDriver(container)` | `makeDOMDriver(container, {transposition: true})` |
| `mockDOMSource(mockConfig)` | `mockDOMSource(streamAdapter, mockConfig)` |
| `makeHTMLDriver()` | `makeHTMLDriver(effectsCallback, options)` |
- `DOMSource.select().elements()` is a simple rename of `observable` to `elements()` as a function call

The new DOM Source conforms to the following API:

``` typescript
interface DOMSource {
  select(selector: string): DOMSource;
  elements(): MemoryStream<Element>;
  events(eventType: string, options?: EventsFnOptions): Stream<Event>;
}

interface EventsFnOptions {
  useCapture?: boolean;
}
```

Where the corresponding stream library used above was xstream, but is an Observable if you are using RxJS.
- `makeDOMDriver` no longer takes an error callback as an option, because top-level errors are handled by Cycle.run
- The DOM Driver from `makeDOMDriver` will no longer apply transposition of the virtual DOM tree if you don't opt-in with the option `transposition: true`

Transposition was a niche feature in Cycle DOM, which enabled you to put a **stream as a child of a virtual DOM node**, like this:

``` js
div([
  Observable.interval(1000).map(i => h2('Crazy dynamic header #' + i)),
  h2('Just a normal header')
])
```

Then the DOM Driver would take care of flattening those structures for you, so the outcome would be a normal virtual DOM tree. Transposition is now optionally enabled, and we recommend people try to build applications without relying on transposition because it may feel too magical.
- `mockDOMSource` requires the first parameter to be a Stream Adapter, which is either the object imported from `@cycle/rx-adapter` or `@cycle/xstream-adapter` or `@cycle/rxjs-adapter` or `@cycle/most-adapter`. Choose the adapter you want so that `mockDOMSource` will produce streams that match the stream library you are using. You don't need to know anything about adapters, other than importing and giving them to `mockDOMSource`
- `makeHTMLDriver` was previously not a real driver because it did not produce any side effects, it just transformed the virtual DOM to HTML as a string. Now, you must provide a callback function `effectsCallback` that takes a string of HTML as input and should perform a side effect. Check the [isomorphic example](https://github.com/cyclejs/examples/tree/master/isomorphic) to see how to use this feature.

Most of the new APIs of Cycle DOM are due to the migration from `virtual-dom` to `snabbdom`, so read next about these two libraries.

## From virtual-dom to snabbdom

The difference between these two underlying libraries is primarily noticed when you are creating virtual DOM elements with hyperscript.

### The same

| virtual-dom (Cycle DOM v9) | snabbdom (Cycle DOM v10) |
| --- | --- |
| `h('h1', 'Hello world')` | `h('h1', 'Hello world')` |
| `h1('Hello world')` | `h1('Hello world')` |
| `span('.foo', 'Hello world')` | `span('.foo', 'Hello world')` |

### Different

Attributes or properties of elements are expressed differently in Snabbdom hyperscript:

| virtual-dom (Cycle DOM v9) | snabbdom (Cycle DOM v10) |
| --- | --- |
| `div({attributes: {'data-d': 'foo'}})` | `div({attrs: {'data-d': 'foo'}})` |
| `input({type: 'text'})` | `input({attrs: {type: 'text'}})`<br /> [or](http://stackoverflow.com/questions/6003819/properties-and-attributes-in-html)<br /> `input({props: {type: 'text'}})` |
| `div({'data-hook': new MyHook()}` | `div({hook: {update: myHookFn}})` |

Read more about [Snabbdom hyperscript here](https://github.com/paldepind/snabbdom/).

### Different SVG hyperscript

Cycle DOM v10 uses Snabbdom to provide better SVG helper functions. Here are some highlights of the differences:

| virtual-dom (Cycle DOM v9) | snabbdom (Cycle DOM v10) |
| --- | --- |
| `svg('svg')` | `svg()` |
| `svg('g')` | `svg.g()` |
| `svg('g', {attributes: {'class': 'child'}})` | `svg.g({attrs: {'class': 'child'}})` |
| `svg('svg', [ svg('g') ])` | `svg([ svg.g() ])` |

## New Cycle HTTP APIs

Cycle HTTP driver comes with some small differences too. The biggest is the addition of the `.select()` API for HTTP Sources, which is similar to `.select()` in the DOM Source.

| Before (Cycle HTTP v8) | After (Cycle HTTP v9) |
| --- | --- |
| `httpSource.filter(res$ => res$.request.category === 'foo').response$$` | `httpSource.select('foo')` |

It's also important to notice that in HTTP v8, `httpSource` was an Observable of Observables. In HTTP v9, it is an "HTTP Source", an object with functions, just like the DOM Source has. **`select('foo')`** returns the stream of response streams that belong to the requests that had the category field `'foo'` attached to them. This is how you should give a category to a request object:

``` js
let request$ = xs.of({
  url: 'http://localhost:8080/hello', // GET method by default
  category: 'hello',
});
```

Categories in the HTTP Driver are like classNames in the DOM Driver. The HTTP Source conforms to this API:

``` typescript
interface HTTPSource {
  response$$: StreamOfResponseStreams;
  filter(predicate: (response$: ResponseStream) => boolean): HTTPSource;
  select(category: string): StreamOfResponseStreams;
}
```

Notice how `httpSource.filter()` is a function that returns a new HTTPSource. It is not a filter function over streams yet. To get an actual stream in your corresponding stream library of use, call `select()` or `response$$`.

## Examples

To see up-to-date examples illustrating the use of Cycle Diversity, check the [examples repository](https://github.com/cyclejs/examples).

Some highlights are:
- [bmi-typescript](https://github.com/cyclejs/examples/tree/master/bmi-typescript) is written in TypeScript
- [http-random-user](https://github.com/cyclejs/examples/tree/master/http-random-user) is written in TypeScript

## For library authors

How to make your driver Diversity-compliant.

Suppose your driver uses `rxjs` as the stream library.

``` diff
+import RxJSAdapter from '@cycle/rxjs-adapter';

 function makeMyDriver() {
   function myDriver() {
     // ...
   }
+  myDriver.streamAdapter = RxJSAdapter;
   return myDriver;
 }
```

# Cycle Nested

> 2015-12-21

**_Cycle Nested is a new version of Cycle.js with a focus on hard-core reusability: any Cycle.js app can be easily reused in a larger Cycle.js app._**

**Cycle Nested consists of:**

- Cycle [Core v6.0.0](https://github.com/cyclejs/cycle-core/releases/tag/v6.0.0) or higher
- Cycle [HTTP Driver v7.0.0](https://github.com/cyclejs/cycle-http-driver/releases/tag/v7.0.0) or higher
- Cycle [DOM v8.0.0](https://github.com/cyclejs/cycle-dom/releases/tag/v8.0.0) or higher
- [`isolate()`](https://github.com/cyclejs/isolate), a helper library for components
- Other compatible drivers

**NEW FEATURES in Cycle Nested:**

- Components are simply Cycle.js apps (`main()` renamed to e.g. `Button()`) that can be reused in larger apps.
- Cycle DOM introduces [hyperscript helpers](https://github.com/ohanhi/hyperscript-helpers), so you can create virtual DOM with functions like `div()`, `h1()`, `ul()`, `li()`, `span()`, etc.

## Migration guide

**Names changed.**

| Before | After |
| --- | --- |
| `DOM.get()` | `DOM.select().events()` |
| Response (naming convention) | Source (naming convention) |
| Request (naming convention) | Sink (naming convention) |
| Cycle DOM `mockDOMResponse()` | Cycle DOM `mockDOMSource()` |
| `labeledSlider` (custom element) | `LabeledSlider` (dataflow component) |
| `let [sinks, sources] = Cycle.run(m, d)` | `let {sinks, sources} = Cycle.run(m, d)` |

Custom Elements removed. Dataflow components replace them.

``` diff
-function labeledSlider(sources) {
+function LabeledSlider(sources) {
-  const initialValue$ = sources.props.get('initial')
+  const initialValue$ = sources.props$
+    .map(props => props.initial)
     .first();

   const newValue$ = sources.DOM
     .select('.slider')
     .events('input')
     .map(ev => ev.target.value);

   const value$ = initialValue$.concat(newValue$);

-  const props$ = sources.props.getAll();

   const vtree$ = Rx.Observable
-    .combineLatest(props$, value$, (props, value) =>
+    .combineLatest(sources.props$, value$, (props, value) =>
       h('div.labeled-slider', [
         h('span.label', [
           props.label + ' ' + value + props.unit
         ]),
         h('input.slider', {
           type: 'range',
           min: props.min,
           max: props.max,
           value: value
         })
       ])
     );

   return {
     DOM: vtree$,
-    events: {
-      newValue: newValue$
-    }
+    value$: value$
   };
 }
```

The function above, `LabeledSlider()` follows the same techniques we use to build any `main()` function in Cycle.js. There is no magic and no tricks, it is simply a function that does what it says it does. The usage of components is very different to the usage of custom elements.

**Not necessary to register the component anymore**:

``` diff
-const domDriver = CycleDOM.makeDOMDriver('#app', {
-  'labeled-slider': labeledSlider // our function
-});
+const domDriver = CycleDOM.makeDOMDriver('#app');
```

**Using a component in a parent view has changed**:

``` diff
 function main(sources) {
   // ...

-  const childValue$ = state(intent(sources.DOM));

+  const props$ = Observable.of({
+    label: 'Radius', unit: '', min: 10, initial: 30, max: 100
+  });
+  const childSources = {DOM: sources.DOM, props$};
+  const labeledSlider = LabeledSlider(childSources);
+  const childVTree$ = labeledSlider.DOM;
+  const childValue$ = labeledSlider.value$;

-  const vtree$ = childValue$.map(
-    value =>
+  const vtree$ = childVTree$.withLatestFrom(childValue$,
+    (childVTree, value) =>
       h('div', [
-        h('labeled-slider#weight', {
-          key: 1, label: 'Weight', unit: 'kg',
-          min: 40, initial: weight, max: 140
-        }),
+        childVTree,
         div({style: {
           backgroundColor: '#58D3D8',
           width: String(value) + 'px',
           height: String(value) + 'px',
           borderRadius: String(value * 0.5) + 'px'
         }})
       ])
     );
   return {
     DOM: vtree$
   };
 }
```

**To get events from a component, we don't use anymore `DOM.select('labeled-slider').events('myCustomEvent')`. Instead, we just get the Observable returned from the `LabeledSlider` component function**.

[Read more instructions about Dataflow components](http://cycle.js.org/components.html).

### Using hyperscript helpers

``` diff
+import { div, span, input } from '@cycle/dom';


-h('div.labeled-slider', [
+div('.labeled-slider', [
-  h('span.label', [
+  span('.label', [
     props.label + ' ' + value + props.unit
   ]),
-  h('input.slider', {
+  input('.slider', {
     type: 'range',
     min: props.min,
     max: props.max,
     value: value
   })
 ])
```

For more help, read the [new documentation site Cycle.js.org](http://cycle.js.org) or ask for help in the [Gitter chat room](https://gitter.im/cyclejs/cycle-core).
