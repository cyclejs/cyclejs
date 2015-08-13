import {Rx, run} from '@cycle/core';
import {h, makeDOMDriver} from '@cycle/dom';
import combineLatestObj from 'rx-combine-latest-obj';

function makeRandomColor() {
  let hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

const ticker = {
  intent(name = '', DOM) {
    const removeClicks$ = DOM.get(`${name}.ticker .remove-btn`, 'click');
    const stop$ = removeClicks$;
    const remove$ = removeClicks$.delay(500);
    return {stop$, remove$};
  },

  model(props, actions) {
    const x$ = Rx.Observable.interval(50).startWith(0).takeUntil(actions.stop$);
    const y$ = Rx.Observable.interval(100).startWith(0).takeUntil(actions.stop$);
    const color$ = Rx.Observable.merge(
      props.color$.takeUntil(actions.stop$),
      actions.stop$.map(() => '#FF0000')
    );
    return combineLatestObj({x$, y$, color$});
  },

  view(name = '', state$) {
    return state$.map(({color, x, y}) =>
      h(`div.ticker${name}`, {
        style: {color, backgroundColor: '#ECECEC'}
      }, [
        h('h4', `x${x} ${color}`),
        h('h1', `Y${y} ${color}`),
        h('button.remove-btn', 'Remove')
      ])
    );
  }
}

function intent(DOM) {
  const tickerActions = ticker.intent('', DOM);
  const getTickerItemId = (ev) => parseInt(
    ev.target.parentElement.className.match(/item\d+/)[0].replace('item', '')
  );
  return {
    stopTicker$: tickerActions.stop$.map(getTickerItemId),
    removeTicker$: tickerActions.remove$.map(getTickerItemId)
  };
}

function model(actions) {
  const color$ = Rx.Observable.interval(1000)
    .map(makeRandomColor)
    .startWith('#000000');

  const insertMod$ = Rx.Observable.interval(5000).take(10)
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

  const mod$ = Rx.Observable.merge(insertMod$, removeMod$);

  return Rx.Observable.just([])
    .merge(mod$)
    .scan((acc, mod) => mod(acc));
}

function view(state$) {
  return state$.map(listOfTickers =>
    h('div#the-view', listOfTickers.map(item =>
      ticker.view('.item' + item.id, item.state$)
    ))
  );
}

function main(responses) {
  return {
    DOM: view(model(intent(responses.DOM)))
  };
}

run(main, {
  DOM: makeDOMDriver('#main-container')
});
