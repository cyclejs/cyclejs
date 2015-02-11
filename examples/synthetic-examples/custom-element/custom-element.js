var h = Cycle.h;
var Rx = Cycle.Rx;

Cycle.registerCustomElement('ticker', function (element, Properties) {
  var TickerModel = Cycle.createModel(function (Properties, Intent) {
    return {
      color$: Properties.get('color$')
        .takeUntil(Intent.get('stop$'))
        .merge(Intent.get('stop$').map(function () { return '#FF0000'; })),
      x$: Rx.Observable.interval(50).takeUntil(Intent.get('stop$')),
      y$: Rx.Observable.interval(100).takeUntil(Intent.get('stop$'))
    };
  });

  var TickerView = Cycle.createView(function (Model) {
    return {
      vtree$: Rx.Observable.combineLatest(
        Model.get('color$'),
        Model.get('x$'),
        Model.get('y$'),
        function (color, x, y) {
          return h('div.ticker', {
            style: {'color': color, 'background-color': '#ECECEC'}
          }, [
            h('h4', 'x' + x + ' ' + color),
            h('h1', 'Y' + y + ' ' + color),
            h('button.remove-btn', {onclick: 'removeClick$'}, 'Remove')
          ]);
        }
      )
    };
  });

  var TickerUser = Cycle.createDOMUser(element);

  var TickerIntent = Cycle.createIntent(function (User) {
    var removeClicks$ = User.event$('.remove-btn', 'click');
    return {
      stop$: removeClicks$.map(function () { return 'stop'; }),
      remove$: removeClicks$.map(function () { return 'remove'; }).delay(500)
    };
  });

  TickerUser
  .inject(TickerView)
  .inject(TickerModel)
  .inject(Properties, TickerIntent)
  [1].inject(TickerUser);

  return {
    remove$: TickerIntent.get('remove$')
  };
});

var Model = Cycle.createModel(function (Intent) {
  function makeRandomColor() {
    var hexColor = Math.floor(Math.random() * 16777215).toString(16);
    while (hexColor.length < 6) {
      hexColor = '0' + hexColor;
    }
    hexColor = '#' + hexColor;
    return hexColor;
  }

  return {
    color$: Rx.Observable.interval(1000)
      .map(makeRandomColor)
      .startWith('#000000'),
    tickerExists$: Rx.Observable.just(true)
      .merge(Intent.get('removeTicker$').map(function () { return false; }))
  };
});

var View = Cycle.createView(function (Model) {
  return {
    vtree$: Rx.Observable.combineLatest(Model.get('color$'), Model.get('tickerExists$'),
      function (color, tickerExists) {
        return h('div#the-view', [
          tickerExists ? h('ticker.ticker', {color: color}) : null
        ]);
      }
    )
  };
});

var User = Cycle.createDOMUser('.js-container');

var Intent = Cycle.createIntent(function (User) {
  return {removeTicker$: User.event$('.ticker', 'remove')};
});

User.inject(View).inject(Model).inject(Intent).inject(User);
