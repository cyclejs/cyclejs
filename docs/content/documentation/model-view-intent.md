# Model-View-Intent

## Split main into parts

We can write our entire Cycle.js program inside the `main()` function, like we did in the [previous chapter](basic-examples.html#basic-examples-body-mass-index-calculator). However, any programmer knows this isn't a good idea. Once `main()` grows too large, it becomes hard to maintain.

**MVI is a simple pattern to refactor the main() function into three parts: Intent (to listen to the user), Model (to process information), and View (to output back to the user).**

![main equal MVI](img/main-eq-mvi.svg)

Let's see how we can refactor the `main()` function we wrote for calculating BMI:

```javascript
import xs from 'xstream';
import {run} from '@cycle/run';
import {div, input, h2, makeDOMDriver} from '@cycle/dom';

function main(sources) {
  const changeWeight$ = sources.DOM.select('.weight')
    .events('input')
    .map(ev => ev.target.value);

  const changeHeight$ = sources.DOM.select('.height')
    .events('input')
    .map(ev => ev.target.value);

  const weight$ = changeWeight$.startWith(70);
  const height$ = changeHeight$.startWith(170);

  const state$ = xs.combine(weight$, height$)
    .map(([weight, height]) => {
      const heightMeters = height * 0.01;
      const bmi = Math.round(weight / (heightMeters * heightMeters));
      return {weight, height, bmi};
    });

  const vdom$ = state$.map(({weight, height, bmi}) =>
    div([
      div([
        'Weight ' + weight + 'kg',
        input('.weight', {type: 'range', min: 40, max: 140, value: weight})
      ]),
      div([
        'Height ' + height + 'cm',
        input('.height', {type: 'range', min: 140, max: 210, value: height})
      ]),
      h2('BMI is ' + bmi)
    ])
  );

  return {
    DOM: vdom$
  };
}

run(main, {
  DOM: makeDOMDriver('#app')
});
```

We have plenty of anonymous functions which could be refactored away from `main`, such as the BMI calculation, VNode rendering, etc.

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, h2, makeDOMDriver} from '@cycle/dom';

+function renderWeightSlider(weight) {
+  return div([
+    'Weight ' + weight + 'kg',
+    input('.weight', {type: 'range', min: 40, max: 140, value: weight})
+  ]);
+}

+function renderHeightSlider(height) {
+  return div([
+    'Height ' + height + 'cm',
+    input('.height', {type: 'range', min: 140, max: 210, value: height})
+  ]);
+}

+function bmi(weight, height) {
+  const heightMeters = height * 0.01;
+  return Math.round(weight / (heightMeters * heightMeters));
+}

 function main(sources) {
   const changeWeight$ = sources.DOM.select('.weight')
     .events('input')
     .map(ev => ev.target.value);

   const changeHeight$ = sources.DOM.select('.height')
     .events('input')
     .map(ev => ev.target.value);

   const weight$ = changeWeight$.startWith(70);
   const height$ = changeHeight$.startWith(170);

   const state$ = xs.combine(weight$, height$)
     .map(([weight, height]) => {
-      const heightMeters = height * 0.01;
-      const bmi = Math.round(weight / (heightMeters * heightMeters));
-      return {weight, height, bmi};
+      return {weight, height, bmi: bmi(weight, height)};
     });

   const vdom$ = state$.map(({weight, height, bmi}) =>
     div([
-      div([
-        'Weight ' + weight + 'kg',
-        input('.weight', {type: 'range', min: 40, max: 140, value: weight})
-      ]),
-      div([
-        'Height ' + height + 'cm',
-        input('.height', {type: 'range', min: 140, max: 210, value: height})
-      ]),
+      renderWeightSlider(weight),
+      renderHeightSlider(height),
       h2('BMI is ' + bmi)
     ])
   );

   return {
     DOM: vdom$
   };
 }

 run(main, {
   DOM: makeDOMDriver('#app')
 });
```

`main` still has to handle too many concerns. Can we do better? Yes, we can, by using the insight that `state$.map(state => someVNode)` is a *View* function: renders visual elements as a transformation of state. Let's introduce `function view(state$)`.

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, h2, makeDOMDriver} from '@cycle/dom';

 function renderWeightSlider(weight) {
   return div([
     'Weight ' + weight + 'kg',
     input('.weight', {type: 'range', min: 40, max: 140, value: weight})
   ]);
 }

 function renderHeightSlider(height) {
   return div([
     'Height ' + height + 'cm',
     input('.height', {type: 'range', min: 140, max: 210, value: height})
   ]);
 }

 function bmi(weight, height) {
   const heightMeters = height * 0.01;
   return Math.round(weight / (heightMeters * heightMeters));
 }

+function view(state$) {
+  return state$.map(({weight, height, bmi}) =>
+    div([
+      renderWeightSlider(weight),
+      renderHeightSlider(height),
+      h2('BMI is ' + bmi)
+    ])
+  );
+}

 function main(sources) {
   const changeWeight$ = sources.DOM.select('.weight')
     .events('input')
     .map(ev => ev.target.value);

   const changeHeight$ = sources.DOM.select('.height')
     .events('input')
     .map(ev => ev.target.value);

   const weight$ = changeWeight$.startWith(70);
   const height$ = changeHeight$.startWith(170);

   const state$ = xs.combine(weight$, height$)
     .map(([weight, height]) => {
       return {weight, height, bmi: bmi(weight, height)};
     });

-  const vdom$ = state$.map(({weight, height, bmi}) =>
-    div([
-      renderWeightSlider(weight),
-      renderHeightSlider(height),
-      h2('BMI is ' + bmi)
-    ])
-  );
+  const vdom$ = view(state$);

   return {
     DOM: vdom$
   };
 }

 run(main, {
   DOM: makeDOMDriver('#app')
 });
```

Now, `main` is much smaller. But is it doing *one thing*? We still have `changeWeight$`, `changeHeight$`, `weight$`, `height$`, `state$`, and the return using `view(state$)`. Normally when we work with a *View*, we also have a *Model*. What Models normally do is **manage state**. In our case, however, we have `state$` which is self-responsible for its own changes, because it is [reactive](streams.html#streams-reactive-programming). But anyway we have code that defines how `state$` depends on `changeWeight$` and `changeHeight$`. We can put that code inside a `model()` function.

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, h2, makeDOMDriver} from '@cycle/dom';

 // ...

+function model(changeWeight$, changeHeight$) {
+  const weight$ = changeWeight$.startWith(70);
+  const height$ = changeHeight$.startWith(170);
+
+  return xs.combine(weight$, height$)
+    .map(([weight, height]) => {
+      return {weight, height, bmi: bmi(weight, height)};
+    });
+}

 function view(state$) {
   return state$.map(({weight, height, bmi}) =>
     div([
       renderWeightSlider(weight),
       renderHeightSlider(height),
       h2('BMI is ' + bmi)
     ])
   );
 }

 function main(sources) {
   const changeWeight$ = sources.DOM.select('.weight')
     .events('input')
     .map(ev => ev.target.value);

   const changeHeight$ = sources.DOM.select('.height')
     .events('input')
     .map(ev => ev.target.value);

-  const weight$ = changeWeight$.startWith(70);
-  const height$ = changeHeight$.startWith(170);
-
-  const state$ = xs.combine(weight$, height$)
-    .map(([weight, height]) => {
-      return {weight, height, bmi: bmi(weight, height)};
-    });
+  const state$ = model(changeWeight$, changeHeight$);

   const vdom$ = view(state$);

   return {
     DOM: view(state$)
   };
 }

 run(main, {
   DOM: makeDOMDriver('#app')
 });
```

`main` still defines `changeWeight$` and `changeHeight$`. What are these streams? They are event streams of *Actions*. In the [previous chapter about basic examples](basic-examples.html#basic-examples-increment-a-counter) we had an `action$` stream for incrementing and decrementing a counter. These Actions are deduced or interpreted from DOM events. Their names indicate the user's *intentions*. We can group these stream definitions in an `intent()` function:

```diff
 import xs from 'xstream';
 import {run} from '@cycle/run';
 import {div, input, h2, makeDOMDriver} from '@cycle/dom';

 // ...

+function intent(domSource) {
+  return {
+    changeWeight$: domSource.select('.weight').events('input')
+      .map(ev => ev.target.value),
+    changeHeight$: domSource.select('.height').events('input')
+      .map(ev => ev.target.value)
+  };
+}

-function model(changeWeight$, changeHeight$) {
-  const weight$ = changeWeight$.startWith(70);
-  const height$ = changeHeight$.startWith(170);
+function model(actions) {
+  const weight$ = actions.changeWeight$.startWith(70);
+  const height$ = actions.changeHeight$.startWith(170);

   return xs.combine(weight$, height$)
     .map(([weight, height]) => {
       return {weight, height, bmi: bmi(weight, height)};
     });
 }

 function view(state$) {
   return state$.map(({weight, height, bmi}) =>
     div([
       renderWeightSlider(weight),
       renderHeightSlider(height),
       h2('BMI is ' + bmi)
     ])
   );
 }

 function main(sources) {
-  const changeWeight$ = sources.DOM.select('.weight')
-    .events('input')
-    .map(ev => ev.target.value);
-
-  const changeHeight$ = sources.DOM.select('.height')
-    .events('input')
-    .map(ev => ev.target.value);
+  const actions = intent(sources.DOM);

-  const state$ = model(changeWeight$, changeHeight$);
+  const state$ = model(actions);

   const vdom$ = view(state$);

   return {
     DOM: vdom$
   };
 }

 run(main, {
   DOM: makeDOMDriver('#app')
 });
```

`main` is finally small enough, and works on one level of abstraction, defining how actions are created from DOM events, flowing to model and then to view, and finally back to the DOM. Because these steps are a chain, we can refactor `main` to compose those three functions `intent`, `model`, and `view` together:

```javascript
function main(sources) {
  return {DOM: view(model(intent(sources.DOM)))};
}
```

Seems like we cannot achieve a simpler format for `main`.

## Summarized

- `intent()` function
  - Purpose: interpret DOM events as user's intended actions
  - Input: DOM source
  - Output: Action Streams
- `model()` function
  - Purpose: manage state
  - Input: Action Streams
  - Output: State Stream
- `view()` function
  - Purpose: visually represent state from the Model
  - Input: State Stream
  - Output: Stream of Virtual DOM nodes as the DOM Driver sink

**Is Model-View-Intent an architecture?** Is this a new architecture? If so, how is it different to Model-View-Controller?

## What MVC is really about

[Model-View-Controller](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93controller) (MVC) has existed since the 80s as the cornerstone architecture for user interfaces. It has inspired multiple other important architectures such as [MVVM](https://en.wikipedia.org/wiki/Model_View_ViewModel) and [MVP](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93presenter).

MVC is characterized by the Controller: a component which manipulates the other parts, updating them accordingly whenever the user does an action.

![MVC](img/mvc-diagram.svg)

The Controller in MVC is incompatible with our reactive ideals, because it is a proactive component (implying either passive Model or passive View). However, the original idea in MVC was a method for translating information between two worlds: that of the computer's digital realm and the user's mental model. In Trygve's own words:

> *The essential purpose of MVC is to bridge the gap between the human user's mental model and the digital model that exists in the computer.* <br />&#8211; [Trygve Reenskaug](http://heim.ifi.uio.no/~trygver/themes/mvc/mvc-index.html), inventor of MVC

We can keep the MVC idea while avoiding a proactive Controller. In fact, if you observe our `view()` function, it does nothing else than transform state (digital model in the computer) to a visual representation useful for the user. View is a translation from one language to another: from binary data to English and other human-friendly languages.

![view translation](img/view-translation.svg)

The opposite direction should be also a straightforward translation from the user's actions to *new* digital data. This is precisely what `intent()` does: interprets what the user is trying to affect in the context of the digital model.

![intent translation](img/intent-translation.svg)

Model-View-Intent (MVI) is **reactive**, **functional**, and follows the **core idea in MVC**. It is reactive because Intent observes the User, Model observes the Intent, View observes the Model, and the User observes the View. It is functional because each of these components is expressed as a [referentially transparent](https://en.wikipedia.org/wiki/Referential_transparency_%28computer_science%29) function over streams. It follows the original MVC purpose because View and Intent bridge the gap between the user and the digital model, each in one direction.

> ### Why CSS selectors?
>
> Some programmers get concerned about `DOM.select(selector).events(eventType)` being a bad practice because it resembles spaghetti code in jQuery-based programs. They would rather prefer the virtual DOM elements to specify handler callbacks for events, such as `onClick={this.handleClick()}`.
>
> The choice for selector-based event querying in Cycle *DOM* is an informed and rational decision. This strategy enables MVI to be reactive and is inspired by the [open-closed principle](https://en.wikipedia.org/wiki/Open/closed_principle).
>
> **Important for reactivity and MVI.** If we had Views with `onClick={this.handleClick()}`, it would mean Views would *not* be anymore a simple translation from digital model to user mental model, because we also specify what happens as a consequence of the user's actions. To keep all parts in a Cycle.js app reactive, we need the View to simply declare a visual representation of the Model. Otherwise the View becomes a Proactive component. It is beneficial to keep the View responsible only for declaring how state is visually represented: it has a [single responsibility](https://en.wikipedia.org/wiki/Single_responsibility_principle) and is friendly to UI designers. It is also conceptually aligned with the [original View in MVC](http://heim.ifi.uio.no/~trygver/1979/mvc-2/1979-12-MVC.pdf): "*... a view should never know about user input, such as mouse operations and
keystrokes.*"
>
> **Adding user actions shouldn't affect the View.** If you need to change Intent code to grab new kinds of events from the element, you don't need to modify code in the VTree element. The View stays untouched, and it should, because translation from state to DOM hasn't changed.
>
> The MVI strategy in Cycle DOM is to name most elements in your View with appropriate semantic classnames. Then you do not need to worry which of those can have event handlers, if all of them can. The classname is the common artifact which the View (DOM sink) and the Intent (DOM source) can use to refer to the same element.
>
> As we will see in the [Components](components.html) chapter, risk of global className collision is not a problem in Cycle.js because of the `isolate()` helper.

MVI is an architecture, but in Cycle it is nothing else than simply a function decomposition of `main()`.

![main equal MVI](img/main-eq-mvi.svg)

In fact, MVI itself just naturally emerged from our refactoring of `main()` split into functions. This means Model, View, and Intent are not rigorous containers where you should place code. Instead, they are just a convenient way of organizing code, and are very cheap to create because they are simply functions. Whenever convenient, you should split a function if it becomes too large. Use MVI as a guide on how to organize code, but don't confine your code within its limits if it doesn't make sense.

This is what it means to say Cycle.js is *sliceable*. MVI is just one way of slicing `main()`.

> ### "Sliceable"?
>
> With "sliceable", we mean the ability to refactor the program by extracting pieces of code without having to significantly modify their surroundings. Sliceability is a feature often found in functional programming languages, especially in LISP-based languages like [Clojure](https://en.wikipedia.org/wiki/Clojure), which use S-expressions to enable treating [*code as data*](https://en.wikipedia.org/wiki/Homoiconicity).

## Pursuing DRY

As good programmers writing good codebases, we must follow [DRY: Don't Repeat Yourself](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself). The MVI code we wrote is not entirely DRY.

For instance, the View rendering of the sliders share a significant amount of code. And in the Intent, we have some duplication of the `DOM.select().events()` streams.

```javascript
function renderWeightSlider(weight) {
  return div([
    'Weight ' + weight + 'kg',
    input('.weight', {type: 'range', min: 40, max: 140, value: weight})
  ]);
}

function renderHeightSlider(height) {
  return div([
    'Height ' + height + 'cm',
    input('.height', {type: 'range', min: 140, max: 210, value: height})
  ]);
}

function intent(domSource) {
  return {
    changeWeight$: domSource.select('.weight')
      .events('input')
      .map(ev => ev.target.value),
    changeHeight$: domSource.select('.height')
      .events('input')
      .map(ev => ev.target.value)
  };
}
```

We could create functions to remove this duplication, as such:

```javascript
function renderSlider(label, value, unit, className, min, max) {
  return div([
    '' + label + ' ' + value + unit,
    input('.' + className, {type: 'range', min, max, value})
  ]);
}

function renderWeightSlider(weight) {
  return renderSlider('Weight', weight, 'kg', 'weight', 40, 140);
}

function renderHeightSlider(height) {
  return renderSlider('Height', height, 'cm', 'height', 140, 210);
}

function getSliderEvent(domSource, className) {
  return domSource.select('.' + className)
    .events('input')
    .map(ev => ev.target.value);
}

function intent(domSource) {
  return {
    changeWeight$: getSliderEvent(domSource, 'weight'),
    changeHeight$: getSliderEvent(domSource, 'height')
  };
}
```

But this still isn't ideal: we seem to have *more* code now. What we really want is just to create *labeled sliders*: one for height, and the other for weight. We should be able to build a generic and reusable labeled slider. In other words, we want the labeled slider to be a [component](components.html).