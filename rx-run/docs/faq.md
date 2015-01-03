### Where to ask for help?

Join the Gitter chat room <br />[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/staltz/cycle?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## What does the suffixed dollar sign `$` mean?

The dollar sign `$` *suffixed* to a name is a hard convention to indicate that the variable is an Observable (instance of an RxJS Observable). Not only is it a naming helper to indicate types, it is also a required convention when working with custom elements. The following are examples of the former and the latter.

If a model exports an observable stream called `lastname$`, then the view can consume it as such:
```javascript
var View = Cycle.createView(['lastname$'], function (model) {
  return {
    vtree$: model.lastname$.map(function (lastname) { return h('h1', lastname); }),
    events: []
});
```

Notice that the function inside `map` takes `lastname` as argument, while the `model` contains `lastname$`. The naming convention indicates that `lastname` is the value being emitted by `lastname$`. Without this convention, if `model.lastname$` would simply be named `model.lastname`, it would confuse readers about the types involved. Also, `lastname$` is succinct compared to `lastnameObservable`, `lastnameStream`, or `lastnameObs`.

The suffixed dollar convention is required for custom elements. When you use a custom element and give it attributes, the attribute name will be suffixed with `$` to recover the Observable inside the custom element's DataFlowNode. Example:

```javascript
var View = Cycle.createView(['lastname$'], function (model) {
  return {
    vtree$: model.lastname$
      .map(function (lastname) {
        return h('custombutton', {attributes {'label': lastname}});
        // lastname emitted into label$ in the DataFlowNode that
        // implements <custombutton>
      }),
    events: []
});
```


## How to implement routing and manage different pages?

Introduce RouteIntent, RouteModel, and RouteView that are wired in a different way than the typical MVI cycle.

```
    ┌─────── Page1Intent ───> RouteIntent <─── Page2Intent ──────┐
    │              ^               │               ^             │
    │              │               V               │             │
    │              │           RouteModel          │             │
    │              │               │               │             │
    V              │               V               │             V
Page1Model ──> Page1View ────> RouteView <──── Page2View <── Page2Model
                                   │
                                   │
                                   V
                                Renderer
```

The idea is to represent the current page (or route) in a RouteModel, then to use a RouteView that consumes the RouteModel, but also consumes Page1View and Page2View. In other words, RouteView should take three inputs. Internally, RouteView is just a switch which redirects only from Page1View if and only if the RouteModel has emitted 'page1' as the current page, or redirects only Page2View if RouteModel emits 'page2'. Then RouteIntent consumes Page1Intent and Page2Intent, the two latter should exports events indicating that the user wants to change the page. For instance, Page1Intent might have an event stream called `goToPage2$`. RouteIntent aggregates these types of events, and the RouteModel will listen to those.

## Why doesn't `ev-mouseover` or other `ev-<event>` work?

The event is not likely part of `DOMDelegators` [`common events`](https://github.com/Raynos/dom-delegator/blob/master/index.js#L13).

You can add them:

```javascript
var renderer = Cycle.createRenderer(<your node>);
renderer.delegator.listenTo('mouseover');
```

See [here](https://github.com/Raynos/dom-delegator/issues/16) for more information.

## How can I set callbacks for changing data in the Model?

(TODO answer this)

## How to get a MVI trio inside a View? **or** How to implement View components inside other components?

(TODO answer this)

## How to handle animations?

(TODO answer this)
