var h = CycleDOM.h;
var Rx = Cycle.Rx;

function tickerCustomElement(ext) {
  var removeClicks$ = ext.DOM.get('.remove-btn', 'click');
  var stop$ = removeClicks$.map(function () { return 'stop'; });
  var remove$ = removeClicks$.map(function () { return 'remove'; }).delay(500);
  var color$ = Rx.Observable.merge(
    ext.props.get('color').takeUntil(stop$),
    stop$.map(function () { return '#FF0000'; })
  );
  var x$ = Rx.Observable.interval(50).startWith(0).takeUntil(stop$);
  var y$ = Rx.Observable.interval(100).startWith(0).takeUntil(stop$);
  var vtree$ = Rx.Observable.combineLatest(color$, x$, y$, function (color, x, y) {
    return h('div.ticker', {
      style: {color: color, backgroundColor: '#ECECEC'}
    }, [
      h('h4', 'x' + x + ' ' + color),
      h('h1', 'Y' + y + ' ' + color),
      h('button.remove-btn', {onclick: 'removeClick$'}, 'Remove')
    ]);
  });

  return {
    DOM: vtree$,
    events: {remove: remove$}
  };
}

function makeRandomColor() {
  var hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

function main(ext) {
  var removeTicker$ = ext.DOM.get('.ticker', 'remove');
  var color$ = Rx.Observable.interval(1000)
    .map(makeRandomColor)
    .startWith('#000000');
  var tickerExists$ = Rx.Observable.just(true)
    .merge(removeTicker$.map(function () { return false; }));
  return {
    DOM: Rx.Observable.combineLatest(color$, tickerExists$,
      function (color, tickerExists) {
        return h('div#the-view', [
          tickerExists ? h('my-ticker.ticker', {key: 1, color: color}) : null
        ]);
      }
    )
  };
}

Cycle.run(main, {
  DOM: CycleDOM.makeDOMDriver('.js-container', {
    'my-ticker': tickerCustomElement
  })
});
