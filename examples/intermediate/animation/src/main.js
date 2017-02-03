// Animation : Intermediate Example

import Cycle from '@cycle/xstream-run';
import xs from 'xstream';
import tween from 'xstream/extra/tween';
import concat from 'xstream/extra/concat';
import {div, button, makeDOMDriver} from '@cycle/dom';


// logger utility to inject into streams for inspection
const show = x => {
  // console.log(JSON.stringify(x))
  console.log(x)
  return x
}

// utility function updating target's position
function targetStyle(left, top) {
  return {
    position: 'relative',
    backgroundColor: 'blue',
    width: '60px',
    height: '60px',
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  };
};

let buttonStyle = {
  fontSize: '20px',
  marginBottom: '20px',
};


function main({ DOM }) {
  let start$ = DOM.select('.animate')
    .events('click')

    // reset stream values to empty
    .mapTo();

  // https://github.com/staltz/xstream/blob/master/src/extra/tween.ts#L118
  // 
  // Creates a stream of numbers emitted in a quick burst, 
  // following a numeric function like sine or elastic or quadratic.
  let leftToRight$ = tween({
    // start with 0
    from: 0, 
    // end with 250
    to: 250, 
    // total duration 1/2 second
    duration: 500, 
    // ease in like cubic power
    ease: tween.power3.easeIn
  })
  .map(show)

  // apply to the left position, keep top constant
  .map(x => ({ left: x, top: 0 }));

  let topToBottom$ = tween({
    from: 0, 
    to: 250, 
    duration: 500, 
    ease: tween.power3.easeOut
  })
  .map(x => ({ left: 250, top: x }));

  let circularReturn$ = tween({
    from: Math.PI / 2, 
    to: Math.PI, 
    duration: 1600, 
    ease: tween.power3.easeInOut
  })

  // apply circular coordinate motion : Stream<Object>
  .map(x => ({ left: 250 + Math.cos(x) * 250, top: Math.sin(x) * 250}));


  // stream start$ emits empty values : Stream<null>
  let coords$ = start$

    // https://github.com/staltz/xstream/blob/master/src/extra/concat.ts#L50
    // 
    // Put streams one after another
    // for each event (button click), 
    // so we get : Stream<Stream<Object>>
    .map(() => concat(
      xs.of({ left: 0, top: 0 }), 
      leftToRight$, 
      topToBottom$, 
      circularReturn$
    ))
    .map(show)

    // -> Stream<Object>
    .flatten()
    .startWith({ left: 0, top: 0 })

  return {
    DOM: coords$.map(({ left, top }) =>
      div([
        button('.animate', {style: buttonStyle}, 'Animate it!'),

        // target is moved around via the 'left' and 'top' props
        div('.target', {style: targetStyle(left, top)}),
      ])
    )
  };
}

Cycle.run(main, {
  // DOM: makeDOMDriver('#main-container')
  DOM: makeDOMDriver(document.body)
});
