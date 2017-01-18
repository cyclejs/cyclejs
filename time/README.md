# @cycle/time

> Fast and beautiful tests and time management for Cycle.js

`@cycle/time` is a library that deals with all things time related in Cycle.js. It's a driver for time, providing methods like `debounce`, `delay`, `throttle` and `periodic`. It also provides tools for elegantly testing streams.

Testing
---

Cycle.js is great because everything all of your application's inputs and outputs are streams. In theory this should make Cycle applications simple to test, because all of the input and output is explicitly passed around.

Cycle is also great for building applications with complex asynchronous behaviour. This is possible because of great observable operators like `debounce` and `delay`.

So what does testing with Cycle look like? The basic principle is to subscribe to a stream, and to make assertions about what it emits. Here's a contrived example:

```js
import assert from 'assert';
import xs from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';

const input$ = fromDiagram('---1---2---3--|');

const actual$ = input$.map(i => i * 2);

const expectedValues = [2, 4, 6];

actual$.take(expectedValues.length).addListener({
  next (value) {
    assert.equal(value, expectedValues.shift());
  },

  error: done,
  complete: done
})
```

We make an input stream, perform an operation on it, and then make assertions about what comes out the other side. This approach can be used for testing Cycle apps as well. Input is passed via sources using say `mockDOMSource` or directly stubbing out the driver, and assertions are made about sink streams coming out.

There are a few problems here. The first is that `xstream`'s `fromDiagram` is very slow. By default, each character in a diagram string represents 20ms.  That diagram is 15 characters long, and will take 300ms to complete. If you have 10 unit tests like that, suddenly your test suite takes 3 seconds.

Additionally, and perhaps more significantly, since `setTimeout` provides no guarantees of accurate scheduling, writing tests with multiple `fromDiagram` inputs will occasionally fail due to events occurring in the wrong order.

Timing is very important for Cycle applications since streams are about "when this happens, this changes". Time and testing are intertwined with Cycle.js.

So where does `@cycle/time` come in? `@cycle/time` is a library that will help you write the asynchronous tests you always dreamed of.

Let's rewrite our contrived example:

```js
import {mockTimeSource} from '@cycle/time';

const Time = mockTimeSource();

const input$    = Time.diagram('---1---2---3--|');
const actual$   = input$.map(i => i * 2);
const expected$ = Time.diagram('---2---4---6--|');

Time.assertEqual(actual$, expected$);

Time.run(done);
```

A few things have changed here. First is that we're now creating our input streams from diagrams using `@cycle/time`. Instead of scheduling their events using `setTimeout`, which as discussed is slow and inconsistent, their events are scheduled on a central queue inside of `@cycle/time`.

This queue is processed when we call `time.run();`. Even though each character in the diagram still represents 20ms, we don't have to wait all that time.  Instead, the application's time is managed by `@cycle/time`, so we can run on "virtual time". This means this test is much faster than the equivalent using `xstream` `fromDiagram`, over 10x faster.

This approach is comparable to RxJS's schedulers and HistoricalScheduler approach, but works with `xstream` and potentially other libraries.

There's one other problem with the `fromDiagram` way of testing.

Say you use an operator that performs a time based operation, like `.delay()`.

```js
import assert from 'assert';
import xs from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';
import delay from 'xstream/extra/delay';

const input$ = fromDiagram('-1--------2---|');

const actual$ = input$.compose(delay(200));

const expectedValues = [1, 2];

actual$.take(expectedValues.length).addListener({
  next (value) {
    assert.equal(value, expectedValues.shift());
  },

  error: done,
  complete: done
})
```

This test will take at least 200ms to run, because once again `delay` is implemented using `setTimeout`. This is also subject to timing problems, which stops us from expressing our expected output using a marble diagram. Here's the same test written with `@cycle/time`.

```js
import {mockTimeSource} from '@cycle/time';

const Time = mockTimeSource();

const input$    = Time.diagram('-1--------2---|');
const actual$   = input$.compose(Time.delay(200));
const expected$ = Time.diagram('-----------1--------2---|');

Time.assertEqual(actual$, expected$);

Time.run(done);
```

Notice that we are now using `Time.delay` instead of the `xstream` equivalent.  Like `Time.diagram`, `Time.delay` is implemented by scheduling onto a central queue, and in tests is processed in "virtual time". This means that we no longer have to wait 200ms, but the `.delay` will function exactly as it did before.

As well as `delay`, `@cycle/time` has implementations of `debounce`, `throttle`, and `periodic`.

What about testing a Cycle component with multiple inputs?

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

Time.assertEqual(
  count$,
  expectedCount$
)

Time.run(done);
```

Development / Production
---

You can use `@cycle/time` in your test suite without using it in dev or production. However, if you want to use any time based operators, you must use the ones provided by `@cycle/time`.

`@cycle/time` exports a `timeDriver`, a driver that provides time based streams and operators. All you need to do is add it your drivers object, and replace usages of time-based operators like `delay`, `debounce`, `throttle` and `periodic` with the `@cycle/time` implementation. Here is a counter using `Time.periodic`.

```js
import {timeDriver} from '@cycle/time';
import {makeDOMDriver, div} from '@cycle/dom';
import {run} from '@cycle/xstream-run';

const drivers = {
  Time: timeDriver,
  DOM: makeDOMDriver('.app')
}

function Counter ({Time}) {
  const count$ = Time.periodic(1000);

  return {
    DOM: count$.map(count => div(`Count: ${count}`))
  }
}

run(Counter, drivers);
```

This will display a counter where the count goes up every second.

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
Returns a stream that emits every `period` msec. Starts with 0, and increases by 1 every time.

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
An operator that can be used with `.compose` that will prevent more than 1 event emitting in the given period.

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

### `mockTimeSource({interval = 20})`

Returns a `TimeSource` object, with all of the methods from the `timeDriver` (`debounce`, `delay`, `periodic`, `throttle`), along with a collection of methods useful for writing unit tests.

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

Time.diagram('---a---b---c---|', {a: 'foo', b: 'bar', c: 'baz'});

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

## Install

Yet to be released

## License

MIT

