# Error handling

Errors in Cycle.js applications usually travel through streams. This means recovery is also stream-based: instead of wrapping the whole application in imperative `try`/`catch` blocks, catch errors close to the effect that produced them and map them back into normal application state.

## Recover inside the effect stream

Drivers often expose errors on a stream for one specific effect. Recover on that inner stream before flattening it into your application state.

For example, with the HTTP driver, `sources.HTTP.select()` returns a stream of response streams. Handle each response stream independently:

```js
const response$ = sources.HTTP.select('users')
  .map(response$ =>
    response$.replaceError(() => xs.of({
      error: true,
      message: 'Could not load users',
    }))
  )
  .flatten();
```

The important part is that `replaceError` is applied to the inner `response$`. A failed request then becomes ordinary data in the application instead of terminating the outer stream.

## Convert errors to state

Prefer converting failures into state that the view can render:

```js
const users$ = response$
  .map(response => response.error
    ? {status: 'error', message: response.message}
    : {status: 'success', users: response.body}
  )
  .startWith({status: 'loading'});

const vdom$ = users$.map(state => {
  if (state.status === 'loading') return div('Loading…');
  if (state.status === 'error') return div('.error', state.message);
  return renderUsers(state.users);
});

return {
  DOM: vdom$,
  HTTP: request$,
};
```

This keeps error handling declarative: the model describes failure states, and the view renders them like any other state.

## Do not recover too late

If an error reaches the top level of `main`, the stream may complete and stop producing future events. Recovering too late can therefore make the application appear frozen after the first failure.

```js
// Too late: the error may terminate this outer stream.
const users$ = sources.HTTP.select('users')
  .flatten()
  .replaceError(() => xs.empty());
```

Recover inside the per-response stream instead, as shown above. This preserves later responses and retries.

## Retry by changing the request stream

The HTTP driver only performs requests described by the outgoing HTTP sink. To retry a failed request, model retry intent explicitly and use it to emit another request:

```js
const initialRequest$ = xs.of({url: '/users', category: 'users'});

const retryRequest$ = retryClick$.mapTo({url: '/users', category: 'users'});

const request$ = xs.merge(initialRequest$, retryRequest$);
```

Then render the retry control from the error state. This keeps the cause/effect direction clear: user intent produces a request, the driver produces a response or error, and recovery maps that result to state.

## Isolate non-fatal errors

Not every failure should replace the whole interface. Recover in the component or branch that owns the effect so unrelated parts of the application continue working.

```js
const profile$ = sources.HTTP.select('profile')
  .map(response$ => response$.replaceError(() => xs.of(null)))
  .flatten()
  .map(profile => profile || fallbackProfile);
```

Use values such as `null`, an empty list, or a typed error object when they are valid domain states. Throw only for programmer errors or truly unrecoverable application failures.

## Stream-library operators

The exact recovery operator depends on the stream library:

- xstream: `replaceError(() => replacementStream)`
- RxJS: `catchError(() => replacementObservable)` (or `catch` in older versions)
- Most.js: `recoverWith(() => replacementStream)`

The pattern is the same in each library: catch near the source, replace the error with either valid state or a stream that continues, and render failures explicitly.
