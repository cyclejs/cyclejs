var h = Cycle.h;
var Rx = Cycle.Rx;

var TickerDataFlowNode = Cycle.createDataFlowNode(['color$'], function (attributes) {
  var TickerModel = Cycle.createModel(['color$'], [], function (attributes, intent) {
    return {
      color$: attributes.color$,
      x$: Rx.Observable.interval(50),
      y$: Rx.Observable.interval(100)
    };
  });

  var TickerView = Cycle.createView(['color$', 'x$', 'y$'], function (model) {
    return {
      events: [],
      vtree$: Rx.Observable.combineLatest(model.color$, model.x$, model.y$,
        function (color, x, y) {
          return h('div.ticker', {style: {'color': color}}, [
            h('h4', 'x'+x+' '+color), h('h1','Y'+y+' '+color)
          ]);
        }
      )
    };
  });

  var TickerIntent = Cycle.createIntent([], function (view) {
    return {};
  });

  TickerIntent.inject(TickerView);
  TickerView.inject(TickerModel);
  TickerModel.inject(attributes, TickerIntent);

  return {
    vtree$: TickerView.vtree$
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

var Model = {
  color$: Rx.Observable.interval(1000)
    .map(makeRandomColor)
    .startWith('#000000')
};

var View = Cycle.createView(['color$'], function (model) {
  return {
    events: [],
    vtree$: model.color$.map(function (color) { 
      return h('div#the-view', [
        h('ticker', {attributes: {'color': color}})
      ]);
    })
  }
});

Cycle.createRenderer('.js-container').inject(View);
View.inject(Model);
