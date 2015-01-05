var h = Cycle.h;
var Rx = Cycle.Rx;

var TickerDataFlowNode = Cycle.createDataFlowNode(function (attributes) {
  var TickerModel = Cycle.createModel(function (attributes, intent) {
    return {
      color$: attributes.get('color$')
        .takeUntil(intent.get('stop$'))
        .merge(intent.get('stop$').map(function () { return '#FF0000'; })),
      x$: Rx.Observable.interval(50).takeUntil(intent.get('stop$')),
      y$: Rx.Observable.interval(100).takeUntil(intent.get('stop$'))
    };
  });

  var TickerView = Cycle.createView(function (model) {
    return {
      vtree$: Rx.Observable.combineLatest(
        model.get('color$'),
        model.get('x$'),
        model.get('y$'),
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

  var TickerIntent = Cycle.createIntent(function (view) {
    return {
      stop$: view.get('removeClick$').map(function () { return 'stop'; }),
      remove$: view.get('removeClick$').map(function () { return 'remove'; }).delay(500)
    };
  });

  TickerIntent.inject(TickerView);
  TickerView.inject(TickerModel);
  TickerModel.inject(attributes, TickerIntent);

  return {
    vtree$: TickerView.get('vtree$'),
    remove$: TickerIntent.get('remove$')
  };
});

function makeRandomColor() {
  var hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

var Model = Cycle.createModel(function (intent) {
  return {
    color$: Rx.Observable.interval(1000)
      .map(makeRandomColor)
      .startWith('#000000'),
    tickerExists$: Rx.Observable.just(true)
      .merge(intent.get('removeTicker$').map(function() { return false; }))
  };
});

var View = Cycle.createView(function (model) {
  return {
    vtree$: Rx.Observable.combineLatest(model.get('color$'), model.get('tickerExists$'),
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

var Intent = Cycle.createIntent(function (view) {
  return {removeTicker$: view.get('removeTicker$')};
});

var renderer = Cycle.createRenderer('.js-container');
renderer.registerCustomElement('ticker', TickerDataFlowNode);
renderer.inject(View);
Intent.inject(View);
View.inject(Model);
Model.inject(Intent);
