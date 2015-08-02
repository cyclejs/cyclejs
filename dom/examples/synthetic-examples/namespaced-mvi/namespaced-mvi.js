var h = CycleDOM.h;
var makeDOMDriver = CycleDOM.makeDOMDriver;
var Rx = Cycle.Rx;

function makeRandomColor() {
  var hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

var ticker = {
  makeIntent: function makeIntent(name) {
    return function tickerIntent(DOM) {
      var removeClicks$ = DOM.get(name + ' .remove-btn', 'click');
      var stop$ = removeClicks$.map(function () { return 'stop'; });
      var remove$ = removeClicks$.map(function () { return 'remove'; }).delay(500);
      return {
        stop$: stop$,
        remove$: remove$
      };
    };
  },

  makeModel: function makeModel(props) {
    return function tickerModel(actions) {
      var x$ = Rx.Observable.interval(50).startWith(0).takeUntil(actions.stop$);
      var y$ = Rx.Observable.interval(100).startWith(0).takeUntil(actions.stop$);
      var color$ = Rx.Observable.merge(
        props.color$.takeUntil(actions.stop$),
        actions.stop$.map(function () { return '#FF0000'; })
      );
      return x$.combineLatest(y$, color$, function (x, y, color) {
        return {x: x, y: y, color: color};
      });
    };
  },

  makeView: function makeView(name) {
    return function tickerView(state$) {
      var vtree$ = state$.map(function(state) {
        return h('div.ticker' + name, {
          style: {color: state.color, backgroundColor: '#ECECEC'}
        }, [
          h('h4', 'x' + state.x + ' ' + state.color),
          h('h1', 'Y' + state.y + ' ' + state.color),
          h('button.remove-btn', 'Remove')
        ]);
      });
      return vtree$;
    }
  }
}

function intent(DOM) {
  var ticker1Intent = ticker.makeIntent('.first');
  var ticker2Intent = ticker.makeIntent('.second');
  return {
    ticker1: ticker1Intent(DOM),
    ticker2: ticker2Intent(DOM)
  };
}

function model(actions) {
  var color$ = Rx.Observable.interval(1000)
    .map(makeRandomColor)
    .startWith('#000000');
  var ticker1Model = ticker.makeModel({color$: color$});
  var ticker2Model = ticker.makeModel({color$: color$});
  var ticker1State$ = ticker1Model(actions.ticker1).publish();
  var ticker2State$ = ticker2Model(actions.ticker2).publish();
  ticker1State$.connect();
  ticker2State$.connect();
  var ticker1Exists$ = Rx.Observable.just(true)
    .merge(actions.ticker1.remove$.map(function () { return false; }))
  var ticker2Exists$ = Rx.Observable.just(true)
    .merge(actions.ticker2.remove$.map(function () { return false; }))

  return Rx.Observable.combineLatest(
    color$, ticker1Exists$, ticker2Exists$,
    function (color, ticker1Exists, ticker2Exists) {
      return {
        color: color,
        ticker1Exists: ticker1Exists,
        ticker2Exists: ticker2Exists,
        ticker1State$: ticker1State$,
        ticker2State$: ticker2State$
      };
    }
  );
}

function view(state$) {
  var ticker1View = ticker.makeView('.first');
  var ticker2View = ticker.makeView('.second');

  return state$.map(function (state) {
    return h('div#the-view', [
      state.ticker1Exists ? ticker1View(state.ticker1State$) : null,
      state.ticker2Exists ? ticker2View(state.ticker2State$) : null
    ])
  });
}

function main(responses) {
  return {
    DOM: view(model(intent(responses.DOM)))
  };
}

Cycle.run(main, {
  DOM: makeDOMDriver('.js-container')
});
