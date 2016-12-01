# @cycle/time

> A single source of truth for time in Cycle.js

In Cycle.js, it's idiomatic to wrap up side effects in drivers, so that apps can easily be composed and tested.

One type of side effect that is often overlooked is time. Operators like `delay`, `debounce` and `periodic`/`interval` are problematic, because they introduce unecessecary delays in automated tests, and can cause tests to intermittently fail thanks to timing errors.

## Usage

We can use a time driver for all of our time based operations:

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

run(main, drivers);
```

This will display a counter where the count goes up every second.

## API

```js
import {makeTimeDriver, makeMockTimeDriver} from '@cycle/time';

const timeDriver = makeTimeDriver({interval: 20});

const Time = timeDriver();
```

### makeTimeDriver({interval = 20})
A factor for the time driver.

Takes an interval that determines how much time each character in a `diagram` represents.

Returns a time driver. The time driver returns a `TimeSource` object with the following methods:

#### diagram(diagramString)
A constructor that takes a string representing a stream and returns a stream. Useful for testing.

```js
Time.diagram('---1---2---3---|').subscribe(i => console.log(i));

Time.run();

// Logs:
// 1
// 2
// 3
```

#### delay(period)
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

#### debounce(period)
An operator that can be used with `.compose` to filter out events if an event had previously occurred within the given `period`.

```js
const input    = Time.diagram(`---1-2---3-4----5-|`);
const expected = Time.diagram(`---1-----3------5-|`);

const stream = input.compose(Time.debounce(60));

Time.assertEqual(
  stream,
  expected,
  done
)
```

#### interval(period)
Returns a stream that emits every `period` msec. Starts with 0, and increases by 1 every time.

```js
const expected = Time.diagram(`---1---2---3---4---|`);

const stream = Time.interval(80);

Time.assertEqual(
  stream.take(5),
  expected,
  done
)
```

### makeMockTimeDriver({interval = 20})

Has the same interface as `makeTimeDriver` but returns a time driver designed for testing.

Instead of all delays and debounces running in real time in your tests, causing unecessary delays, they will be run in "virtual time".

Has some additional methods:

#### run()
Executes the schedule. This should be called at the end of your test run.


#### assertEqual(actualStream, expectedStream, done)
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
  Time.diagram('---1---2---3--|'),
  Time.diagram('---1---3---2--|'),

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

