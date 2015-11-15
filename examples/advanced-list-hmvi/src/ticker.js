import {Observable} from 'rx';
import {div, h4, h1, button} from '@cycle/dom';
import combineLatestObj from 'rx-combine-latest-obj';

function intent(DOM, name = '') {
  const removeClicks$ = DOM.select(`${name}.ticker .remove-btn`).events('click');
  const stop$ = removeClicks$;
  const remove$ = removeClicks$.delay(500);
  return {stop$, remove$};
}

function model(props, actions) {
  const x$ = Observable.interval(50).startWith(0).takeUntil(actions.stop$);
  const y$ = Observable.interval(100).startWith(0).takeUntil(actions.stop$);
  const color$ = Observable.merge(
    props.color$.takeUntil(actions.stop$),
    actions.stop$.map(() => '#FF0000')
  );
  return combineLatestObj({x$, y$, color$});
}

function view(state$, name = '') {
  return state$.map(({color, x, y}) => {
    const style = {color, backgroundColor: '#ECECEC'};
    return div(`.ticker${name}`, {style}, [
      h4(`x${x} ${color}`),
      h1(`Y${y} ${color}`),
      button('.remove-btn', 'Remove')
    ]);
  });
}

export default {intent, model, view};
