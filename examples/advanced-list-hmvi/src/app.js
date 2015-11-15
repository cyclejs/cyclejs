import {Observable} from 'rx';
import {div, h3} from '@cycle/dom';
import ticker from './ticker.js';

function makeRandomColor() {
  let hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

function intent(DOM) {
  const tickerActions = ticker.intent(DOM);
  const getTickerItemId = (ev) => parseInt(
    ev.target.parentElement.className.match(/item\d+/)[0].replace('item', '')
  );
  return {
    stopTicker$: tickerActions.stop$.map(getTickerItemId),
    removeTicker$: tickerActions.remove$.map(getTickerItemId)
  };
}

function model(actions) {
  const color$ = Observable.interval(1000)
    .map(makeRandomColor)
    .startWith('#000000');

  const insertMod$ = Observable.interval(5000).take(10)
    .map(id => function (oldList) {
      const stopThisTicker$ = actions.stopTicker$.filter(x => x === id);
      const tickerState$ = ticker.model({color$}, {stop$: stopThisTicker$})
        .replay(null, 1);
      tickerState$.connect();
      return oldList.concat([{id, state$: tickerState$}]);
    });

  const removeMod$ = actions.removeTicker$
    .map(id => function (oldList) {
      return oldList.filter(item => item.id !== id);
    });

  const mod$ = Observable.merge(insertMod$, removeMod$);

  return Observable.just([])
    .merge(mod$)
    .scan((acc, mod) => mod(acc));
}

function view(state$) {
  return state$.map(listOfTickers =>
    div('#the-view', listOfTickers.length ?
      listOfTickers.map(item => ticker.view(item.state$, `.item${item.id}`)) :
      h3('Loading...')
    )
  );
}

export default {intent, model, view};
