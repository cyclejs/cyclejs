import {Observable, Subject} from 'rx';
import {h3, div} from '@cycle/dom';
import isolate from '@cycle/isolate';
import Ticker from './Ticker.js';

function makeRandomColor() {
  let hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

function intent(DOM, tickerActions) {
  return {
    removeTicker$: tickerActions.remove$
  };
}

function model(actions, TickerComponent) {
  const color$ = Observable.interval(1000)
    .map(makeRandomColor)
    .startWith('#000000');

  const insertMod$ = Observable.interval(5000).take(10)
    .map(id => function (oldList) {
      const out = TickerComponent(color$, id);
      out.DOM = out.DOM.replay(null, 1);
      out.DOM.connect();
      out.remove = out.remove.publish();
      out.remove.connect();
      return oldList.concat([{id, DOM: out.DOM, remove: out.remove}]);
    });

  const removeMod$ = actions.removeTicker$
    .map(id => function (oldList) {
      return oldList.filter(item => item.id !== id);
    });

  const mod$ = Observable.merge(insertMod$, removeMod$);

  return Observable.just([])
    .merge(mod$)
    .scan((acc, mod) => mod(acc))
    .shareReplay(1);
}

function view(children$, name = '') {
  const loading = h3('Loading...');
  return children$.map(children =>
    div('#the-view', children.length > 0 ? children : [loading])
  );
}

const TickerWrapper = sources => (color$, id) => {
  const ticker = isolate(Ticker)({DOM: sources.DOM, color: color$});
  return {
    DOM: ticker.DOM,
    remove: ticker.remove.map(() => id)
  };
}

function App(sources) {
  const tickerProxyActions = {remove$: new Subject()};
  const actions = intent(sources.DOM, tickerProxyActions);
  const tickers$ = model(actions, TickerWrapper(sources));
  const tickerViews$ = tickers$.map(list => list.map(t => t.DOM));
  const tickerRemove$ = tickers$.flatMapLatest(list =>
    Observable.merge(list.map(t => t.remove))
  );
  tickerRemove$.subscribe(tickerProxyActions.remove$.asObserver());
  const vtree$ = view(tickerViews$);
  return {
    DOM: vtree$
  };
}

export default App;
