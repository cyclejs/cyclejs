import {Rx} from '@cycle/core';
import {h} from '@cycle/dom';
import InjectableObservable from 'rx-injectable-observable';
import ticker from './ticker.js';

function makeRandomColor() {
  let hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

function intent(DOM, tickerActions) {
  const getTickerItemId = (name) => parseInt(name.replace('.item', ''))
  return {
    removeTicker$: tickerActions.remove$.map(getTickerItemId)
  };
}

function model(actions, ticker) {
  const color$ = Rx.Observable.interval(1000)
    .map(makeRandomColor)
    .startWith('#000000');

  const insertMod$ = Rx.Observable.interval(5000).take(10)
    .map(id => function (oldList) {
      const out = ticker(color$, id);
      out.DOM = out.DOM.replay(null, 1);
      out.DOM.connect();
      out.remove = out.remove.publish();
      out.remove.connect();
      console.log('connect new ticker');
      return oldList.concat([{id, DOM: out.DOM, remove: out.remove}]);
    });

  const removeMod$ = actions.removeTicker$
    .map(id => function (oldList) {
      return oldList.filter(item => item.id !== id);
    });

  const mod$ = Rx.Observable.merge(insertMod$, removeMod$);

  return Rx.Observable.just([])
    .merge(mod$)
    .scan((acc, mod) => mod(acc))
    .shareReplay(1);
}

function view(children$, name = '') {
  const loading = h('h3', 'Loading...');
  return children$.map(children =>
    h('div#the-view', children.length > 0 ? children : [loading])
  );
}

function app(sources, name = '') {
  const tickerActions = {remove$: new Rx.Subject()};
  const actions = intent(sources.DOM, tickerActions);
  const tickerCurriedWithDOM = (color$, id) =>
    ticker({DOM: sources.DOM, color: color$}, `.item${id}`);
  const tickers$ = model(actions, tickerCurriedWithDOM);
  const tickerViews$ = tickers$.map(list => list.map(t => t.DOM));
  const tickerRemove$ = tickers$
    .filter(arr => arr.length)
    .flatMapLatest(list =>
      Rx.Observable.merge(list.map(t => t.remove))
    );
  tickerRemove$.subscribe(tickerActions.remove$.asObserver());
  const vtree$ = view(tickerViews$);
  return {
    DOM: vtree$
  }
}

export default app;
