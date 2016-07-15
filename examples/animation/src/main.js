import Cycle from '@cycle/xstream-run';
import xs from 'xstream';
import tween from 'xstream/extra/tween';
import concat from 'xstream/extra/concat';
import {div, button, makeDOMDriver} from '@cycle/dom';

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

function main(sources) {
  let start$ = sources.DOM.select('.animate').events('click').mapTo();

  let leftToRight$ = tween({
    from: 0, to: 250, duration: 500, ease: tween.power3.easeIn
  }).map(x => ({ left: x, top: 0 }));

  let topToBottom$ = tween({
    from: 0, to: 250, duration: 500, ease: tween.power3.easeOut
  }).map(x => ({ left: 250, top: x }));

  let circularReturn$ = tween({
    from: Math.PI / 2, to: Math.PI, duration: 1600, ease: tween.power3.easeInOut
  }).map(x => ({ left: 250 + Math.cos(x) * 250, top: Math.sin(x) * 250}));

  let coords$ = start$.map(() => concat(
    xs.of({ left: 0, top: 0 }), leftToRight$, topToBottom$, circularReturn$
  )).flatten().startWith({ left: 0, top: 0 });

  let vdom$ = coords$.map(({ left, top }) =>
    div([
      button('.animate', {style: buttonStyle}, 'Animate it!'),
      div('.target', {style: targetStyle(left, top)}),
    ])
  );

  return {
    DOM: vdom$
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('#main-container')
});
