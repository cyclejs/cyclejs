import xs from 'xstream';
import delay from 'xstream/extra/delay';
import {div, h1, h4, button} from '@cycle/dom';

function intent(DOMSource) {
  const removeClicks$ = DOMSource.select('.remove-btn').events('click');
  const stop$ = removeClicks$;
  const remove$ = removeClicks$.compose(delay(500)).take(1);
  return xs.merge(
    stop$.mapTo({type: 'stop'}),
    remove$.mapTo({type: 'remove'})
  );
}

function model(action$, givenColor$) {
  const stop$ = action$.filter(a => a.type === 'stop');
  const x$ = xs.periodic(50).startWith(0).endWhen(stop$);
  const y$ = xs.periodic(100).startWith(0).endWhen(stop$);
  const color$ = xs.merge(
    givenColor$.endWhen(stop$),
    stop$.mapTo('#FF0000')
  );
  return xs.combine((x, y, color) => ({x, y, color}), x$, y$, color$);
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
  const action$ = intent(sources.DOM);
  const state$ = model(action$, sources.color);
  const vtree$ = view(state$);
  return {
    DOM: vtree$,
    action$: action$,
  };
}

export default Ticker;
