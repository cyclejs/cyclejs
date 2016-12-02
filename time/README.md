# @cycle/time

> Fast and beautiful tests and time management for Cycle.js

Cycle.js is great because everything all of your application's inputs and outputs are streams. In theory this should make Cycle applications simple to test, because all of the input and output is explicitly passed around.

Cycle is also great for building applications with complex asynchronous behaviour. This is possible because of great observable operators like `debounce` and `delay`.

So what does testing with Cycle look like? The basic principle is to subscribe to a stream, and to make assertions about what it emits. Here's a contrived example:

```js
import assert from 'assert';
import xs from 'xstream';
import fromDiagram from 'xstream/extra/fromDiagram';

const input = fromDiagram('---1---2---3--|');

const stream = input.map(i => i * 2);

const expectedValues = [2, 4, 6];

stream.take(expectedValues.length).addListener({
  next (value) {
    assert.equal(value, expectedValues.shift());
  },

  error (error) {
    done(error);
  },

  complete () {
    done()
  }
})
```

We make an input stream, perform an operation on it, and then make assertions about what comes out the other side. This approach can be used for testing Cycle apps as well. Input is passed via sources using say `mockDOMSource` or directly stubbing out the driver, and assertions are made about sink streams coming out.

There are a few problems here. The first is that `xstream`'s `fromDiagram` is very slow. By default, each character in a diagram string represents 20ms.  That diagram is 15 characters long, and will take 300ms to complete. If you have 10 unit tests like that, suddenly your test suite takes 3 seconds.

Additionally, and perhaps more significantly, since `setTimeout` provides no guarantees of accurate scheduling, writing tests with multiple `fromDiagram` inputs will occasionally fail due to events occurring in the wrong order.

Timing is very important for Cycle applications since streams are about "when this happens, this changes". Time and testing are intertwined with Cycle.js.

So where does `@cycle/time` come in? `@cycle/time` is a library that will help you write the asynchronous tests you always dreamed of.

Let's rewrite our contrived example:

```js
import {makeTimeDriver} from '@cycle/time';

const timeDriver = makeTimeDriver();
const Time = timeDriver();

const input    = Time.diagram('---1---2---3--|');
const expected = Time.diagram('---2---4---6--|');

const stream = input.map(i => i * 2);

Time.assertEqual(stream, expected, done);

Time.run();
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

const input = fromDiagram('-1--------2---|');

const stream = input.compose(delay(200));

const expectedValues = [1, 2];

stream.take(expectedValues.length).addListener({
  next (value) {
    assert.equal(value, expectedValues.shift());
  },

  error (error) {
    done(error);
  },

  complete () {
    done()
  }
})
```

This test will take at least 200ms to run, because once again `delay` is implemented using `setTimeout`. This is also subject to timing problems, which stops us from expressing our expected output using a marble diagram. Here's the same test written with `@cycle/time`.

```js
import {makeTimeDriver} from '@cycle/time';

const timeDriver = makeTimeDriver();
const Time = timeDriver();

const input    = Time.diagram('-1--------2---|');
const expected = Time.diagram('-----------1--------2---|');

const stream = input.compose(Time.delay(200));

Time.assertEqual(stream, expected, done);

Time.run();
```

Notice that we are now using `Time.delay` instead of the `xstream` equivalent.  Like `Time.diagram`, `Time.delay` is implemented by scheduling onto a central queue, and in tests is processed in "virtual time". This means that we no longer have to wait 200ms, but the `.delay` will function exactly as it did before.

As well as `delay`, `@cycle/time` has implementations of `debounce`, `throttle`, and `interval`.

Outside of your tests, `@cycle/time` acts as a driver that provides time based streams and operators. All you need to do is add it your drivers object, and replace usages of time-based operators like `delay`, `debounce`, `throttle` and `periodic` with the `@cycle/time` implementation. Here is a simple counter using `Time.interval`.

```js
import {makeTimeDriver} from '@cycle/time';
import {makeDOMDriver, div} from '@cycle/dom';
import {run} from '@cycle/xstream-run';

const drivers = {
  Time: makeTimeDriver(),
  DOM: makeDOMDriver('.app')
}

function Counter ({Time}) {
  const count$ = Time.interval(1000);

  return {
    DOM: count$.map(count => div(`Count: ${count}`))
  }
}

run(Counter, drivers);
```

This will display a counter where the count goes up every second.

## API

```js
import {makeTimeDriver, makeMockTimeDriver} from '@cycle/time';

const timeDriver = makeTimeDriver({interval: 20});

const Time = timeDriver();
```

### `makeTimeDriver({interval = 20})`
A factory for the time driver.

Takes an interval that determines how much time each character in a `diagram` represents.

Returns a time driver. The time driver returns a `TimeSource` object with the following methods:

#### `delay(period)`
An operator that can be used with `.compose` to delay values in a stream. `period` is the number of milliseconds to delay each event by.

```js
const input    = Time.diagram(`---1---2---3---|`);
const expected = Time.diagram(`------1---2---3---|`);

const stream = input.compose(Time.delay(60));

Time.assertEqual(
  stream,
  expected,
  done
)
```

#### `debounce(period)`
An operator that can be used with `.compose` to filter out events if an event had previously occurred within the given `period`.

```js
const input    = Time.diagram(`---1-----3-4----5-|`);
const expected = Time.diagram(`------1-------4---|`);

const stream = input.compose(Time.debounce(60));

Time.assertEqual(
  stream,
  expected,
  done
)
```

#### `interval(period)`
Returns a stream that emits every `period` msec. Starts with 0, and increases by 1 every time.

```js
const expected = Time.diagram(`---0---1---2---3---4|`);

const stream = Time.interval(80);

Time.assertEqual(
  stream.take(5),
  expected,
  done
)
```

### `makeMockTimeDriver({interval = 20})`

Has the same interface as `makeTimeDriver` but returns a time driver designed for testing.

Instead of all delays and debounces running in real time in your tests, causing unecessary delays, they will be run in "virtual time".

Has some additional methods:

#### `run()`
Executes the schedule. This should be called at the end of your test run.

#### `diagram(diagramString)`
A constructor that takes a string representing a stream and returns a stream. Useful for testing.

```js
Time.diagram('---1---2---3---|').subscribe(i => console.log(i));

Time.run();

// Logs:
// 1
// 2
// 3
```

#### `assertEqual(actualStream, expectedStream, done)`
Can be used to assert two streams are equivalent. This is useful when combine with `.diagram` for creating tests.

```js
// passes

Time.assertEqual(
  Time.diagram('---1---2---3--|'),
  Time.diagram('---1---2---3--|'),

  (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Success!');
    }
  }
)

// fails

Time.assertEqual(
  Time.diagram('---1---3---2--|'),
  Time.diagram('---1---2---3--|'),

  (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Success!');
    }
  }
)
```

## Install

Yet to be released

## License

MIT

