# @cycle/time

> Fast and beautiful tests and time management for Cycle.js

`@cycle/time` is a library that deals with all things time related in Cycle.js. It's a driver for time, providing methods like `debounce`, `delay`, `throttle` and `periodic`. It also provides tools for elegantly testing Cycle applications and any functions that use streams.

Features
---

`@cycle/time` is split into two parts, `timeDriver` and `mockTimeSource`.

**Development/production** - `timeDriver`

 * Super smooth side effect free implementations of `periodic`, `delay`, `debounce` and more
 * Enables excellent dev tooling like hot code reloading and time travel
 * Powered by `requestAnimationFrame`, so your apps will be faster and smoother

**Testing** - `mockTimeSource`

 * Write tests using marble diagram syntax, including expected output
 * Blazing fast! 100x faster than tests written with `xstream`'s `fromDiagram`
 * No more intermittent failures and timing errors. Runs in virtual time so ordering is guaranteed.
 * No more tests timing out when they fail, assertions works even with streams that don't complete

Installation
---

```bash
$ npm install @cycle/time --save
```

Usage (Development / Production)
---

`@cycle/time` exports a `timeDriver`, a driver that provides time based streams and operators.

Firstly import the `timeDriver`.
<!-- share-code-between-examples -->

```js
import {timeDriver} from '@cycle/time';
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

The `timeDriver` also provides `delay`, `debounce` and `throttle` operators that can be used with `.compose`.

Additionally, the `timeDriver` provides support for animations. `animationFrames` can be used to build games or animations. `throttleAnimation` can be used to throttle a stream so that only one event passes through each frame.

Usage (Testing)
---

One of the primary strengths of Cycle's design is that all of your application's inputs and outputs are streams, and all side effects are handled in drivers. In theory this should make Cycle applications simple to test, because all of the input and output is explicitly passed around.

Cycle is also great for building applications with complex asynchronous behaviour. This is possible because of useful observable operators like `debounce`, `delay` and `throttle`.

So what does testing with Cycle look like? The basic principle is to subscribe to a stream, and to make assertions about what it emits. Here's a contrived example (using mocha):

```js
import assert from 'assert';
import xs from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';

function double (i) {
  return i * 2;
}

describe('double', () => {
  it('doubles a number', (done) => {
    const input$ = fromDiagram('---1---2---3--|');

    const actual$ = input$.map(double);

    const expectedValues = [2, 4, 6];

    actual$.take(expectedValues.length).addListener({
      next (value) {
        assert.equal(value, expectedValues.shift());
      },

      error: done,
      complete: done
    })
  });
});
```

We make an input stream, perform an operation on it, and then make assertions about what comes out the other side. This approach can be used for testing Cycle apps as well. Input is passed via sources using say `mockDOMSource` or directly stubbing out the driver, and assertions are made about sink streams coming out.

There are a few problems here. The first is that `xstream`'s `fromDiagram` is very slow. By default, each character in a diagram string represents 20ms.  The above diagram is 15 characters long, and will take 300ms to complete. If you have 10 unit tests like that, suddenly your test suite takes 3 seconds.

Additionally, and perhaps more significantly, since `setTimeout` provides no guarantees of accurate scheduling, writing tests with multiple `fromDiagram` inputs will occasionally fail due to events occurring in the wrong order.

Timing is very important for Cycle applications since streams are about "when this happens, this changes". Time and testing are intertwined with Cycle.js.

So where does `@cycle/time` come in?

```js
import {mockTimeSource} from '@cycle/time';

function double (i) {
  return i * 2;
}

describe('double', () => {
  it('doubles a number', (done) => {
    const Time = mockTimeSource();

    const input$    = Time.diagram('---1---2---3--|');
    const actual$   = input$.map(double);
    const expected$ = Time.diagram('---2---4---6--|');

    Time.assertEqual(actual$, expected$);

    Time.run(done);
  });
});
```

A few things have changed here. First is that we're now creating our input streams from diagrams using `@cycle/time`. Instead of scheduling their events using `setTimeout`, which is slow and inconsistent, their events are scheduled on a central queue inside of `@cycle/time`.

This queue is processed when we call `Time.run();`. Even though each character in the diagram still represents 20ms, we don't have to wait all that time.  Instead, the application's time is managed by `@cycle/time`, so we can run on "virtual time". This means this test is much faster than the equivalent using `xstream` `fromDiagram`, around 100x faster.

This approach is comparable to RxJS's schedulers and HistoricalScheduler approach, but works with `xstream` and potentially other libraries.

There's one other problem with the `fromDiagram` way of testing.

Say you use an operator that performs a time based operation, like `.delay()`.

```js
import assert from 'assert';
import xs from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';
import delay from 'xstream/extra/delay';

describe('xstream delay', () => {
  it('slows our test down by 200ms', (done) => {
    const input$ = fromDiagram('-1--------2---|');

    const actual$ = input$.compose(delay(200));

    const expectedValues = [1, 2];

    actual$.take(expectedValues.length).addListener({
      next (value) {
        assert.equal(value, expectedValues.shift());
      },

      error: done,
      complete: done
    });
  });
});
```

This test will take at least 200ms to run, because once again `delay` is implemented using `setTimeout`. This is also subject to timing problems, which stops us from expressing our expected output using a marble diagram. Here's the same test written with `@cycle/time`.

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

Usage (testing Cycle applications)
---

Say we have a counter, defined like this:

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

We can test this counter using `mockDOMSource`, `snabddom-selector` and `@cycle/time`.

```js
import {mockTimeSource} from '@cycle/time';
import {mockDOMSource} from '@cycle/dom';
import xsAdapter from '@cycle/xstream-adapter';
import {select} from 'snabbdom-selector'

import {Counter} from '../src/counter';

describe('Counter', () => {
  it('increments and decrements in response to clicks', (done) => {
    const addClick      = `---x--x-------x--x--|`;
    const subtractClick = `---------x----------|`;
    const expectedCount = `0--1--2--1----2--3--|`;

    const Time = mockTimeSource();
    const DOM = mockDOMSource(xsAdapter, {
      '.add': {
        'click': Time.diagram(addClick)
      },

      '.subtract': {
        'click': Time.diagram(subtractClick)
      },
    });

    const counter = Counter({DOM});

    const count$ = counter.DOM.map(vtree => select('.count', vtree)[0].text);

    const expectedCount$ = Time.diagram(expectedCount);

    Time.assertEqual(count$, expectedCount$)

    Time.run(done);
  });
});
```

If you want to see more examples of tests using `@cycle/time`, check out the test directory.

## FAQ

### Why would I want to use the time based operators provided by this library over the ones from `xstream`?

xstream's time-based operators (`periodic`, `delay`, `debounce`, `throttle`, etc) are implemented using `setTimeout`.

`setTimeout` provides no guarantee that it will actually fire the event precisely at the given interval. The variance in `setTimeout` has a few consequences.

 * It makes it impossible to consistently record streams into diagrams, which prevents asserting two streams are equal
 * Events might occur in different orders each time the code is run
 * Operators implemented using `setTimeout` cause a real delay in tests. A delay of 300ms is common for normal `fromDiagram` tests

Instead, `@cycle/time` schedules events onto a central queue. In tests, they are then emitted as fast as possible, while guaranteeing the ordering.

This allows incredibly fast tests for complex asynchronous behaviour. A `@cycle/time` test takes 3-5ms to run on my machine.

This approach also means we can express our expected output using a diagram, which is nice.

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
const expected$ = Time.diagram(`---0---1---2---3---4|`);

Time.assertEqual(
  actual$.take(5),
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

The diagram syntax is inspired by xstream's [fromDiagram](Vhttps://github.com/staltz/xstream/blob/master/EXTRA_DOCS.md#-fromdiagramdiagram-options) and RxJS's [marble diagrams](Vhttps://github.com/ReactiveX/rxjs/blob/master/doc/writing-marble-tests.md).

 * `-` the passage of time without any events, by default 20 virtual millseconds (can be changed by passing an argument to `mockTimeSource`)
 * `1` numbers 0-9 are treated as literal numeric values
 * `a` other literal values are strings
 * `|` completion of the stream
 * `#` an error

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

#### `assertEqual(actualStream, expectedStream, done)`
Can be used to assert two streams are equivalent. This is useful when combine with `.diagram` for creating tests.

```js
// passes

Time.assertEqual(
  Time.diagram('---1---2---3--|'),
  Time.diagram('---1---2---3--|'),
);

Time.run();

// fails

Time.assertEqual(
  Time.diagram('---1---3---2--|'),
  Time.diagram('---1---2---3--|')
);

Time.run(err => console.error(err));
```

## License

MIT

