# @cycle/time

> Fast and beautiful tests and time management for Cycle.js

`@cycle/time` is a time driver and tool for testing Cycle.js applications. It works great with `xstream`, `rxjs` and `most`.

It allows you to write beautiful, fast, declarative tests for your Cycle.js applications using marble diagrams. This is made possible by treating time as a side effect, and wrapping it up in a driver.

Influences
---

`@cycle/time` was inspired by and expands upon the approach used by the `TestScheduler` used in `RxJS`. By reimagining the scheduler as a driver, we can better meet the needs of Cycle.js users, and enable powerful test tooling across multiple stream libraries with the same tool.

Additionally, `@cycle/time` implements the API of all the time-based operators provided by `xstream`.

Why put Time in a Driver?
---

Time is a side effect, therefore we should interact with Time through a driver.

Methods like `xs.periodic` and `Observable.delay()` use imperative calls to `setTimeout` and other browser APIs to schedule events. This is a change in state outside of the scope of our applications, so it should be treated as a side effect.

Installation
---

To install the stable version:

```bash
$ npm install @cycle/time --save
```

## FAQ

### Why would I want to use the time based operators provided by this library over the ones from my stream library?

Stream libraries' time-based operators (`xstream`'s `periodic`, `delay`, `debounce`, `throttle`, etc) are implemented using `setTimeout`.

`setTimeout` [provides no guarantee](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Reasons_for_delays_longer_than_specified) that it will actually fire the event precisely at the given interval. The variance in `setTimeout` has a few consequences.

 * It makes it impossible to consistently record streams into diagrams, which prevents asserting two streams are equal
 * Events might occur in different orders each time the code is run
 * Operators implemented using `setTimeout` cause a real delay in tests. A delay of 300ms is common for normal `fromDiagram` tests

Instead, `@cycle/time` schedules events onto a central queue. In tests, they are then emitted as fast as possible, while guaranteeing the ordering.

This allows incredibly fast tests for complex asynchronous behaviour. A `@cycle/time` test takes 3-5ms to run on my machine.

This approach also means we can express our expected output using a diagram, which is nice.


### (RxJS) Why would I want to use `@cycle/time` over the `TestScheduler` from `RxJS`?

The `TestScheduler` is [an excellent piece of software](https://www.ericponto.com/blog/2017/01/08/rxjs-marble-diagram-tests-with-qunit/) and was a primary inspiration for this library, but it was not designed for Cycle.js.

If you use time-based operators from `RxJS` such as `.delay(200)` or `.debounceTime(200)`, you will notice that they do not work as expected with the `TestScheduler` unless the scheduler is passed as the second argument to the operator.

Aside from it being slightly sad to have to change our app code to enable testing, we now have to pass our test scheduler into our Cycle application. We then need to have logic to determine if we should use the normal scheduler for an operator in production or the test scheduler.

Other people have solved this with global injection and stubbing, but that doesn't feel very in the spirit of Cycle.js to me.

By using `@cycle/time` you can have testing just as good, if not better, than the `TestScheduler` while not having to change your code for tests.

### (RxJS and Most) How do I use operators like `.delay` and `.debounce` without `.compose`?

The equivalent to `.compose` in RxJS is `.let`.

```js
Observable.of('Hello World').let(Time.delay(200));
```

The equivalent to `.compose` in Most is `.thru`.

```js
most.of('Hello World').thru(Time.delay(200));
```

Usage (Development / Production)
---

`@cycle/time` exports a `timeDriver`, a driver that provides time based streams and operators.

Firstly import the `timeDriver`.
<!-- share-code-between-examples -->

xstream:
```js
import {timeDriver} from '@cycle/time';
```

RxJS:
<!-- skip-example -->
```js
import {timeDriver} from '@cycle/time/rxjs';
```

most.js:
<!-- skip-example -->
```js
import {timeDriver} from '@cycle/time/most';
```

Then it needs to be added to the drivers object.

```js
const drivers = {
  DOM: makeDOMDriver('.app'),
  Time: timeDriver
}
```

Here is a simple timer using `periodic`.

```js
function Timer (sources) {
  const count$ = sources.Time.periodic(1000);

  return {
    DOM: count$.map(count => div(`${count} seconds elapsed`))
  }
}

run(Timer, drivers);
```
The `timeDriver` also provides `delay`, `debounce` and `throttle` operators that can be used with `.compose` (aka RxJS `.let`, Most `.thru`).

Additionally, the `timeDriver` provides support for animations. `animationFrames` can be used to build games or animations. `throttleAnimation` can be used to throttle a stream so that only one event passes through each frame.

Usage (Testing)
---

One of the primary strengths of Cycle's design is that all of your application's inputs and outputs are streams, and all side effects are handled in drivers. In theory this should make Cycle applications simple to test, because all of the input and output is explicitly passed around.

Cycle is also great for building applications with complex asynchronous behaviour. This is possible because of useful observable operators like `debounce`, `delay` and `throttle`.

Here's an example of what testing with `@cycle/time` looks like:

Say we have a counter component that we want to test,  defined like this:

```js
function Counter ({DOM}) {
  const add$ = DOM
    .select('.add')
    .events('click')
    .mapTo(+1);

  const subtract$ = DOM
    .select('.subtract')
    .events('click')
    .mapTo(-1);

  const change$ = xs.merge(add$, subtract$);

  const count$ = change$.fold((total, change) => total + change, 0);

  return {
    DOM: count$.map(count =>
      div('.counter', [
        div('.count', count.toString()),
        button('.add', 'Add'),
        button('.subtract', 'Subtract')
      ])
    )
  }
}
```

In the test file, firstly import `mockTimeSource`.

xstream:
```js
import {mockTimeSource} from '@cycle/time';
```

RxJS:
<!-- skip-example -->
```js
import {mockTimeSource} from '@cycle/time/rxjs';
```

most.js:
<!-- skip-example -->
```js
import {mockTimeSource} from '@cycle/time/most';
```

For testing components that use `@cycle/dom` we will also want `mockDOMSource` and potentially `snabbdom-selector`.

```js
import {mockDOMSource} from '@cycle/dom';
import {select} from 'snabbdom-selector'

import {Counter} from '../src/counter';

describe('Counter', () => {
  it('increments and decrements in response to clicks', (done) => {
    const Time = mockTimeSource();

    const addClick$      = Time.diagram(`---x--x-------x--x--|`);
    const subtractClick$ = Time.diagram(`---------x----------|`);
    const expectedCount$ = Time.diagram(`0--1--2--1----2--3--|`);

    const DOM = mockDOMSource({
      '.add': {
        click: addClick$
      },

      '.subtract': {
        click: subtractClick$
      },
    });

    const counter = Counter({DOM});

    const count$ = counter.DOM.map(vtree => select('.count', vtree)[0].text);

    Time.assertEqual(count$, expectedCount$)

    Time.run(done);
  });
});
```

**Marble Syntax**

The diagrams in the above test are called [marble diagrams](https://github.com/ReactiveX/rxjs/blob/master/doc/writing-marble-tests.md).

The diagram syntax is inspired by xstream's [fromDiagram](https://github.com/staltz/xstream/blob/master/EXTRA_DOCS.md#-fromdiagramdiagram-options) and RxJS's [marble diagrams](Vhttps://github.com/ReactiveX/rxjs/blob/master/doc/writing-marble-tests.md).

 * `-` the passage of time without any events, by default 20 virtual milliseconds
 * `1` numbers 0-9 are treated as literal numeric values
 * `a` other literal values are strings
 * `|` completion of the stream
 * `#` an error
 * `(ab)` "a" and "b" simultaneously

We make input streams, run our app, and then make assertions about what comes out the other side.

When we call `Time.diagram()`, the events in our diagram are placed on a central queue inside of `Time`. This is called the `schedule`.

This queue is processed when we call `Time.run();`, one event at a time. Even though each character in the diagram still represents 20ms, we don't have to wait all that time.  Instead, the application's time is managed by `@cycle/time`, so we can run on "virtual time". This means this test is much faster than the equivalent using `xstream` `fromDiagram`, around 100x faster.

This approach is comparable to RxJS's schedulers and `TestScheduler` approach, but works across `xstream`, `rxjs` and `most`.

We can also use `@cycle/time` to declaratively test time based operators such as `delay` and `debounce`.

```js
import {mockTimeSource} from '@cycle/time';

describe('@cycle/time delay', () => {
  it('is super quick because of virtual time', (done) => {
    const Time = mockTimeSource();

    const input$    = Time.diagram('-1--------2---|');
    const actual$   = input$.compose(Time.delay(200));
    const expected$ = Time.diagram('-----------1--------2---|');

    Time.assertEqual(actual$, expected$);

    Time.run(done);
  });
});
```

Notice that we are now using `Time.delay` instead of the `xstream` equivalent.  Like `Time.diagram`, `Time.delay` is implemented by scheduling onto a central queue, and in tests is processed in "virtual time". This means that we no longer have to wait 200ms, but the `.delay` will function exactly as it did before.

If you want to see more examples of tests using `@cycle/time`, check out the test directory.

## API

```js
import {timeDriver, mockTimeSource} from '@cycle/time';
```

### `timeDriver()`
The time driver returns a `TimeSource` object with the following methods:

#### `delay(period)`
An operator that can be used with `.compose` to delay values in a stream. `period` is the number of milliseconds to delay each event by.

```js
const input$    = Time.diagram(`---1---2---3---|`);
const actual$   = input$.compose(Time.delay(60));
const expected$ = Time.diagram(`------1---2---3---|`);

Time.assertEqual(
  actual$,
  expected$
);

Time.run();
```

#### `debounce(period)`
An operator that can be used with `.compose`. `debounce` delays events by the given `period` and only emits them if no other event occurs in the meantime.

```js
const input$    = Time.diagram(`---1-----3-4----5-|`);
const actual$   = input$.compose(Time.debounce(60));
const expected$ = Time.diagram(`------1-------4---|`);

Time.assertEqual(
  actual$,
  expected$
);

Time.run();
```

#### `periodic(period)`
Returns a stream that emits every `period` msec. Starts with zero and increases by one every time.

```js
const actual$ = Time.periodic(80);
const expected$ = Time.diagram(`----0---1---2---3-`);

Time.assertEqual(
  actual$,
  expected$
);

Time.run();
```

#### `throttle(period)`
An operator that can be used with `.compose` that will prevent more than one event emitting in the given period.

```js
const input$    = Time.diagram(`--1-2-----3--4----5|`);
const actual$   = input$.compose(Time.throttle(60));
const expected$ = Time.diagram(`--1-------3-------5|`);

Time.assertEqual(
  actual$,
  expected$
);

Time.run();
```

#### `throttleAnimation`
An operator that can be used with `.compose` that will only allow one event in each animation frame. Uses `requestAnimationFrame`.

Useful for throttling noisy streams like scroll events or mousemose events.

The period between frames should be around `16ms` if the application is focused and running smoothly, but may greatly increase if the application is in the background.

```js
const scroll$ = DOM.select('body').events('scroll');

const throttledScroll$ = scroll$.compose(Time.throttleAnimation)
```

#### `animationFrames`
A factory that returns a stream of frames. Each frame is an object with three values:

* `time` - the elapsed time in millseconds since application start
* `delta` - the time in milliseconds since the last frame
* `normalizedDelta` - the delta divided by the expected frame length (16ms). Useful for game development

```js
const frames$ = Time.animationFrames();
```

For more information on `requestAnimationFrame`, see the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame).

### `mockTimeSource({interval = 20})`

Returns a `TimeSource` object, with all of the methods from the `timeDriver` (`debounce`, `delay`, `periodic`, `throttle`), along with `diagram`, `assertEqual` and `run`, which are useful for writing unit tests.

Instead of all delays and debounces running in real time in your tests, causing unecessary delays, they will be run in "virtual time".

Has some additional methods that are useful for testing:

#### `run(doneCallback = raiseError)`
Executes the schedule. This should be called at the end of your test run. Takes a callback that takes an error as the first argument if an error occurs, such as an assertion failing.

If no callback is provided, errors will be raised.

#### `diagram(diagramString, values = {})`
A constructor that takes a string representing a stream and returns a stream.

Each event in the diagram will be scheduled based on their index in the string and the interval provided to `mockTimeSource`.

The stream returned by diagram will only emit events once `Time.run()` is called.

`diagram` can also take an optional values object that can be used to emit more complex values than simple literals.

```js
Time.diagram('---1---2---3---|').subscribe(i => console.log(i));

Time.run();

// Logs:
// 1
// 2
// 3

Time.diagram(
  '---a---b---c---|',
  {a: 'foo', b: 'bar', c: 'baz'}
).subscribe(i => console.log(i));

Time.run();

// Logs:
// foo
// bar
// baz
```

#### `assertEqual(actualStream, expectedStream, comparator = assert.deepEqual)`
Can be used to assert two streams are equivalent. This is useful when combined with `.diagram` for creating tests.

```js
// passes

Time.assertEqual(
  Time.diagram('---1---2---3--|'),
  Time.diagram('---1---2---3--|'),
);

Time.run();
```
<!-- skip-example -->
```js
// fails

Time.assertEqual(
  Time.diagram('---1---3---2--|'),
  Time.diagram('---1---2---3--|')
);

Time.run(err => console.error(err));
```

You can optionally pass a custom comparator function. This is useful if you want to do things like testing your DOM with tools such as [html-looks-like](https://github.com/staltz/html-looks-like).

A custom comparator function should take two arguments: `actual`, and `expected`. It can either return a boolean, or throw an error. If an error is thrown, it will be shown in the error log.

```js
// returns a boolean

function comparator (actual, expected) {
  return actual.foo === expected.foo;
}

// throws an error

function comparator (actual, expected) {
  if (actual.foo !== expected.foo) {
    throw new Error(`${actual.foo} should be the same as ${expected.foo}`);
  }
}
```

```js
// passes

const expected = Time.diagram(
  `---A---B---C---|`,
  {
    A: {foo: 1, bar: 4},
    B: {foo: 2, bar: 5},
    C: {foo: 3, bar: 6}
  }
);

const actual = Time.diagram(
  `---A---B---C---|`,
  {
    A: {foo: 0, bar: 4},
    B: {foo: 5, bar: 5},
    C: {foo: 8, bar: 6}
  }
);

function mycomparator (actual, expected) {
  return actual.bar === expected.bar;
}

Time.assertEqual(
  actual,
  expected,
  mycomparator
);

Time.run();
```
## License

MIT

