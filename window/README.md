# `@cycle/window`

A read-only Cycle.js driver for events on the browser `window` object. It keeps global browser events separate from DOM node selection and rendering.

## Installation

```sh
npm install @cycle/window
```

## Usage

```typescript
import {run} from '@cycle/run';
import {div, makeDOMDriver} from '@cycle/dom';
import {makeWindowDriver, WindowSource} from '@cycle/window';

function main(sources: {Window: WindowSource}) {
  const vdom$ = sources.Window.events('resize')
    .map(event => {
      const browser = event.currentTarget as Window;
      return div(`${browser.innerWidth} × ${browser.innerHeight}`);
    })
    .startWith(div('Resize the browser window'));

  return {DOM: vdom$};
}

run(main, {
  DOM: makeDOMDriver('#app'),
  Window: makeWindowDriver(),
});
```

Standard event names are typed through `WindowEventMap`, so `events('resize')`, `events('hashchange')`, and other browser events expose their corresponding event types. Custom event names return `Stream<Event>`.

## Listener options

`events()` accepts options equivalent to the DOM driver's event API:

```typescript
const keydown$ = sources.Window.events('keydown', {
  useCapture: true,
  preventDefault: {key: 'Escape'},
});

const scroll$ = sources.Window.events('scroll', {
  passive: true,
});
```

`preventDefault` accepts a boolean, predicate function, or partial object matcher. The keydown example uses an object matcher because predicate callbacks receive the base `Event` type, not the event-name-specific stream type. It cannot be combined with `passive: true`, because browsers do not allow passive listeners to cancel events.

Listeners are installed lazily when a stream receives its first subscription and removed when its last subscription is disposed.

## Testing and non-global windows

Pass a window explicitly when testing, using an iframe, or working with another window context:

```typescript
const drivers = {
  Window: makeWindowDriver(iframe.contentWindow!),
};
```

Without an injected value, the driver resolves the browser's global `window` when the Cycle program starts. It throws a descriptive error when started outside a browser, rather than failing later during event registration.
