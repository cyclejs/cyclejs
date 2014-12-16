### Where to ask for help?

Join the Gitter chat room <br />[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/staltz/cycle?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

## How can I set callbacks for changing data in the Model?

(TODO answer this)

## What do the dollar signs `$` mean?

(TODO answer this)

## How to get a MVI trio inside a View? **or** How to implement View components inside other components?

(TODO answer this)

## How to handle animations?

(TODO answer this)
