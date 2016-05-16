import xs from 'xstream';
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

function intent(DOM, tickerAction$) {
  const tickerRemove$ = tickerAction$.filter(a => a.type === 'remove');
  const action$ = xs.merge(
    tickerRemove$
  );
  return action$;
}

function model(action$, TickerComponent) {
  const insertReducer$ = xs.periodic(5000).take(10)
    .map(id => function insertReducer(oldList) {
      const color$ = xs.periodic(1000)
        .map(makeRandomColor)
        .startWith('#000000');
      const out = TickerComponent(color$, id);
      return oldList.concat([{id, DOM: out.DOM, action$: out.action$}]);
    });

  const removeReducer$ = action$
    .filter(a => a.type === 'remove')
    .map(action => function removeReducer(oldList) {
      return oldList.filter(item => item.id !== action.id);
    });

  const list$ = xs.merge(insertReducer$, removeReducer$)
    .fold((oldList, reducer) => reducer(oldList), [])
    .remember();

  return list$;
}

function view(children$, name = '') {
  const loading = h3('Loading...');
  return children$.map(children =>
    div('#the-view', children.length > 0 ? children : [loading])
  );
}

const TickerWrapper = sources => function TickerComponent(color$, id) {
  const ticker = isolate(Ticker)({DOM: sources.DOM, color: color$});
  return {
    DOM: ticker.DOM,
    action$: ticker.action$.map(a => {
      a.id = id;
      return a;
    }),
  };
}

function App(sources) {
  const tickerProxyAction$ = xs.create();
  const action$ = intent(sources.DOM, tickerProxyAction$);
  const tickers$ = model(action$, TickerWrapper(sources));
  const tickerViews$ = tickers$.map(list => list.map(t => t.DOM));
  const tickerAction$ = tickers$
    .map(list => xs.merge(...list.map(t => t.action$)))
    .flatten();
  tickerProxyAction$.imitate(tickerAction$);
  const vtree$ = view(tickerViews$);
  const sinks = {
    DOM: vtree$
  };
  return sinks;
}

export default App;
