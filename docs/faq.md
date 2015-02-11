### Where to ask for help?

Join the Gitter chat room <br />[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/staltz/cycle?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Aren't View and Intent tightly coupled to each other?

Model-View-Intent serve to separate the concerns in user interfaces. Often, there are 3 concerns for any UI: there is information inside the computer (model), information is displayed to the user (view), the user interacts with what he sees (intent). In MVI, each of those concerns is expressed as function. Inputs and outputs. There is a **natural** coupling between View and "interacting with what you are seeing", independent of any solution or framework. Therefore, in React or in Cycle or in Mercury, Intent will be coupled to View.

In React components, Intent is **mixed** with View, so it ends up being disguised as one thing. In reality you have no tools for separating interaction concerns from display concerns. In Cycle, the coupling still exists, but you are allowed to separate the concerns by declaring appearance in one box (View), and interaction in another box (Intent). For this reason, it's useful to co-locate Intent and View in the same file.

## How does intercommunication between Views work in Cycle architectures?

There are two ways of structuring your Cycle app views: with hierarchical composition, or with reactive composition. There are cases where it's more elegant to use hierarchical composition, and cases where reactive composition is better.

**Hierarchical composition** is the use of a tree of custom elements (components) that talk to each other in parent-child relationships. It makes sense to use a custom element for every "widget-like" user interface element that will or can be used in multiple instances. For instance avatars in a chat, or news feed items on a list. Why? Because you might want to handle low level user interaction events with those, and it's good that the custom element can manage its own interaction, rather than leaking that responsibility to the parent. This is exactly the typical React hierarchy of components.

**Reactive composition** is about DataFlowNodes. It makes sense to use a View (which is a DataFlowNode) to represent top-level or high-level pages or sections of your app. These should be singleton, and other modules should be able to import them. Why? Let's say you want to send analytics events whenever the user scrolls down on any page. Let's say you have 5 different pages. Instead of spreading out multiple calls to `analytics.sendEvent()` in all those 5 pages (the interactive/imperative way), you just make one `DataFlowSink` that listens to scroll events from the 5 pages, and does the `analytics.sendEvent()` internally. This way you don't have `analytics.sendEvent()` called inside many pages. The pages shouldn't be concerned at all about analytics, that's a side effect, and not their core responsibility.

Other concerns such as saves to localStorage can also be implemented the same way, and that's only possible with DataFlowNodes. If the whole app is just one big tree of custom elements, then you can't really separate those concerns.
Also, trying to put `analytics.sendEvent()` inside a custom element would be a code smell. A "utility" user interface element (e.g. buttons, grid views, avatars, tags, bars, carousels) shouldn't be concerned about business logic.

You can also allow these Views to communicate with each other through a common top-level Model, or multiple top-level Models. This resembles the Flux architecture, where Models are Data Stores. In Cycle, you are allowed to create as many Models and Intents as you wish, as well as generic DataFlowNodes living in between. The complete set of top-level DataFlowNodes, Models, and Views are connected together with `inject` calls. If you put all these `inject` calls in one single top-level file `app.js`, then you get for free a dataflow graph of your whole app, by interpreting `a.inject(b)` as an arrow `a <-- b` in the dataflow graph.

## What does the suffixed dollar sign `$` mean?

The dollar sign `$` *suffixed* to a name is a hard convention to indicate that the variable is an Observable (instance of an RxJS Observable). Not only is it a naming helper to indicate types, it is also a required convention when working with custom elements. The following are examples of the former and the latter.

If a model exports an observable stream called `lastname$`, then the view can consume it as such:
```javascript
var View = Cycle.createView(['lastname$'], function (model) {
  return {
    vtree$: model.lastname$.map(function (lastname) { return h('h1', lastname); })
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
      })
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
                                DOMUser
```

The idea is to represent the current page (or route) in a RouteModel, then to use a RouteView that consumes the RouteModel, but also consumes Page1View and Page2View. In other words, RouteView should take three inputs. Internally, RouteView is just a switch which redirects only from Page1View if and only if the RouteModel has emitted 'page1' as the current page, or redirects only Page2View if RouteModel emits 'page2'. Then RouteIntent consumes Page1Intent and Page2Intent, the two latter should exports events indicating that the user wants to change the page. For instance, Page1Intent might have an event stream called `goToPage2$`. RouteIntent aggregates these types of events, and the RouteModel will listen to those.

## How can I set callbacks for changing data in the Model?

(TODO answer this)

## How to get a MVI trio inside a View? **or** How to implement View components inside other components?

(TODO answer this)

## How to handle animations?

(TODO answer this)
