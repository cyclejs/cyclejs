import {Observable} from 'rx';
import {div, h1, h4, button} from '@cycle/dom';
import combineLatestObj from 'rx-combine-latest-obj';

function intent(DOM, name = '') {
  const removeClicks$ = DOM.select('.remove-btn').events('click');
  const stop$ = removeClicks$;
  const remove$ = removeClicks$.delay(500);
  return {stop$, remove$};
}

function model(actions, givenColor$) {
  const x$ = Observable.interval(50).startWith(0).takeUntil(actions.stop$);
  const y$ = Observable.interval(100).startWith(0).takeUntil(actions.stop$);
  const color$ = Observable.merge(
    givenColor$.takeUntil(actions.stop$),
    actions.stop$.map(() => '#FF0000')
  );
  return combineLatestObj({x$, y$, color$});
}

function view(state$) {
  return state$.map(({color, x, y}) => {
    const style = {color, backgroundColor: '#ECECEC'};
    return div('.ticker', {style}, [
      h4(`x${x} ${color}`),
      h1(`Y${y} ${color}`),
      button('.remove-btn', 'Remove')
    ]);
  });
}

function Ticker(sources) {
  const actions = intent(sources.DOM);
  const state$ = model(actions, sources.color);
  const vtree$ = view(state$);
  return {
    DOM: vtree$,
    remove: actions.remove$,
  };
}

export default Ticker;
