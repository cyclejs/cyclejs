import {Rx} from '@cycle/core';
import {h} from '@cycle/dom';
import combineLatestObj from 'rx-combine-latest-obj';

function intent(DOM, name = '') {
  const removeClicks$ = DOM.select(`${name}.ticker .remove-btn`)
    .events('click');
  const stop$ = removeClicks$;
  const remove$ = removeClicks$.map(() => name).delay(500);
  return {stop$, remove$};
}

function model(actions, givenColor$) {
  const x$ = Rx.Observable.interval(50).startWith(0).takeUntil(actions.stop$);
  const y$ = Rx.Observable.interval(100).startWith(0).takeUntil(actions.stop$);
  const color$ = Rx.Observable.merge(
    givenColor$.takeUntil(actions.stop$),
    actions.stop$.map(() => '#FF0000')
  );
  return combineLatestObj({x$, y$, color$});
}

function view(state$, name = '') {
  return state$.map(({color, x, y}) => {
    const style = {color, backgroundColor: '#ECECEC'};
    return h(`div.ticker${name}`, {style}, [
      h('h4', `x${x} ${color}`),
      h('h1', `Y${y} ${color}`),
      h('button.remove-btn', 'Remove')
    ]);
  });
}

function ticker(sources, name = '') {
  const actions = intent(sources.DOM, name);
  const state$ = model(actions, sources.color);
  const vtree$ = view(state$, name);
  return {
    DOM: vtree$,
    remove: actions.remove$,
  };
}

export default ticker;
