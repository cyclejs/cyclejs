var h = Cycle.h;
var Rx = Cycle.Rx;

var TickerDataFlowNode = Cycle.createDataFlowNode(['color$'], function (attributes) {
  var TickerModel = Cycle.createModel(['color$'], ['stop$'], function (attributes, intent) {
    return {
      color$: attributes.color$
        .takeUntil(intent.stop$)
        .merge(intent.stop$.map(function () { return '#FF0000'; })),
      x$: Rx.Observable.interval(50).takeUntil(intent.stop$),
      y$: Rx.Observable.interval(100).takeUntil(intent.stop$)
    };
  });

  var TickerView = Cycle.createView(['color$', 'x$', 'y$'], function (model) {
    return {
      events: ['removeClick$'],
      vtree$: Rx.Observable.combineLatest(model.color$, model.x$, model.y$,
        function (color, x, y) {
          return h('div.ticker', {
            style: {'color': color, 'background-color': '#ECECEC'}
          }, [
            h('h4', 'x'+x+' '+color),
            h('h1','Y'+y+' '+color),
            h('button', {'ev-click': 'removeClick$'}, 'Remove')
          ]);
        }
      )
    };
  });

  var TickerIntent = Cycle.createIntent(['removeClick$'], function (view) {
    return {
      stop$: view.removeClick$.map(function () { return 'stop'; }),
      remove$: view.removeClick$.map(function () { return 'remove'; }).delay(500)
    };
  });

  TickerIntent.inject(TickerView);
  TickerView.inject(TickerModel);
  TickerModel.inject(attributes, TickerIntent);

  return {
    vtree$: TickerView.vtree$,
    remove$: TickerIntent.remove$
  };
});

Cycle.registerCustomElement('ticker', TickerDataFlowNode);

function makeRandomColor() {
  var hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

var Model = Cycle.createModel(['removeTicker$'], function (intent) {
  return {
    color$: Rx.Observable.interval(1000)
      .map(makeRandomColor)
      .startWith('#000000'),
    tickerExists$: Rx.Observable.just(true)
      .merge(intent.removeTicker$.map(function() { return false; }))
  };
});

var View = Cycle.createView(['color$', 'tickerExists$'], function (model) {
  return {
    events: ['removeTicker$'],
    vtree$: Rx.Observable.combineLatest(model.color$, model.tickerExists$,
      function (color, tickerExists) { 
        return h('div#the-view', [
          tickerExists ? h('ticker', {
            attributes: {'color': color},
            'ev-remove': 'removeTicker$'
          }) : null
        ]);
      }
    )
  };
});

var Intent = Cycle.createIntent(['removeTicker$'], function (view) {
  return {removeTicker$: view.removeTicker$};
})

Cycle.createRenderer('.js-container').inject(View);
Intent.inject(View);
View.inject(Model);
Model.inject(Intent);
