### Where to ask for help?

Join the Gitter chat room <br />[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/staltz/cycle?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## What does the suffixed dollar sign `$` mean?

The dollar sign `$` *suffixed* to a name is a hard convention to indicate that the variable is an Observable (instance of an RxJS Observable). Not only is it a naming helper to indicate types, it is also a required convention when working with custom elements. The following are examples of the former and the latter.

Suppose you have an Observable of VTree depending on an Observable of "lastname" string:
```javascript
var vtree$ = lastname$.map(lastname => h('h1', lastname));
```

Notice that the function inside `map` takes `lastname` as argument, while the Observable is named `lastname$`. The naming convention indicates that `lastname` is the value being emitted by `lastname$`. In general, `foobar$` emits `foobar`. Without this convention, if `lastname$` would be named simply `lastname`, it would confuse readers about the types involved. Also, `lastname$` is succinct compared to alternatives like `lastnameObservable`, `lastnameStream`, or `lastnameObs`. This convention can also be extended to arrays: use plurality to indicate the type is an array. Example: `vtrees` is an array of `vtree`, but `vtree$` is an Observable of `vtree`.

The suffixed dollar convention is required for custom elements. When you create a custom element with custom events, the custom event Observables must be suffixed with `$` but in the `interaction.get(selector, eventType)` function you provide the `eventType` without the `$` suffix. Example:

```javascript
Cycle.registerCustomElement('my-element', function myelement() {
  return {
    vtree$: Rx.Observable.just(h('h1', 'Hello world')),
    myevent$: Rx.Observable.interval(1000) // notice suffix
  };
});

function computer(interactions) {
  return interactions.get('.target', 'myevent') // notice no suffix
    .map(ev =>
      h('div', [
        h('my-element.target'),
        h('h2', ev.data)
      ])
    );
}
```

## Aren't View and Intent tightly coupled to each other?

Model-View-Intent is an architecture to separate the concerns in user interfaces. Often, there are 3 concerns for any UI: there is information inside the computer (Model), information is translated into user language (View), the user's interactions are interpreted as intentions to affect the computer's information (Intent). In MVI, each of those concerns is expressed as function. You should only be concerned about inputs and outputs.

They may or may not be inherent coupling between View and Intent. With a personal AI assistant such as Siri or Google Now, View displays graphics, but Intent handles voice recognition, and there is no coupling between them. MVI is an architecture that handles all types of user interfaces. Touch screens and interactive widgets on the screen are just one specific type of user interface, albeit the most common one. There is an **inherent** coupling between View and "interacting with what you are seeing", independent of any solution or framework. Intent in these cases will often be referring to what was displayed in the View. Therefore, in React or in Cycle or in Mercury, the Intent concern will be coupled to the View concern.

In React components, Intent is **mixed** with View, so it ends up being disguised as one thing. In reality you have no tools for separating interaction concerns from display concerns. In Cycle, the coupling still exists, but you are allowed to separate the concerns by declaring appearance in one box (View), and interaction in another box (Intent). For this reason, it's useful to co-locate Intent and View in the same file.

## How does intercommunication between Views work in Cycle architectures?

There are two ways of structuring your Cycle app views: with hierarchical composition, or with reactive composition. There are cases where it's more elegant to use hierarchical composition, and cases where reactive composition is better.

**Hierarchical composition** is the use of a tree of custom elements (components) that talk to each other in parent-child relationships. It makes sense to use a custom element for every "widget-like" user interface element that will or can be used in multiple instances. For instance avatars in a chat, or news feed items on a list. Why? Because you might want to handle low level user interaction events with those, and it's good that the custom element can manage its own interaction, rather than leaking that responsibility to the parent. This is exactly the typical React hierarchy of components.

**Reactive composition** is about composing `vtree$` Observables. It makes sense to use a `vtree$` (outside of the context of a custom element) to represent top-level or high-level pages or sections of your app. Other modules should be able to import these VTree Observables. Why? Let's say you want to send analytics events whenever the user scrolls down on any page. Let's say you have 5 different pages. Instead of spreading out multiple calls to `analytics.sendEvent()` in all those 5 pages (the interactive/imperative way), you just subscribe to an Observable which combines all scroll events from those 5 pages and do the `analytics.sendEvent()` in the subscriber. This way you don't have `analytics.sendEvent()` called inside many pages. The pages shouldn't be concerned at all about analytics, that's a side effect, and not their core responsibility.

Other concerns such as saves to localStorage can also be implemented the same way, and that's only possible with the reactive pattern, which in our context means using Rx.Observable. If the whole app is just one big tree of custom elements, then you can't really separate those concerns.
Also, trying to put `analytics.sendEvent()` inside a custom element would be a code smell. A "utility" user interface element (e.g. buttons, grid views, avatars, tags, bars, carousels) shouldn't be concerned about business logic.

You can also allow these VTree Observables to communicate with each other through a common top-level Model Observable, or multiple top-level Observables. This resembles the Flux architecture, where Model Observables are Stores. In Cycle, you are allowed to create as many Observables as you wish, you choose how to split and compose Observables and functions over them.
