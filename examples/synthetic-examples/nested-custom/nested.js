var h = Cycle.h;

// This example tests 3 issues:
// - Whether custom events from a custom element are caught by the parent View/User
// - Whether custom events on a custom element are catchable even when the root element is
//   not a div (in this case, an h2).
// - Whether Model streams internal to a custom element can be used in the custom
//   element's return object. E.g. Model.get('foo$').

Cycle.registerCustomElement('inner-elem', function (User, Properties) {
  var Model = Cycle.createModel(function (Properties, Intent) {
    return {
      foo$: Properties.get('foo$').shareReplay(1),
      content$: Intent.get('refreshData$')
        .map(function () { return Math.round(Math.random() * 1000); })
        .merge(Properties.get('content$'))
        .shareReplay(1)
    };
  });

  var View = Cycle.createView(function (Model) {
    return {
      vtree$: Model.get('content$')
        .map(function (content) {
          return h('h2.innerRoot', {
            style: {
              margin: '10px',
              background: '#ececec',
              padding: '5px',
              cursor: 'pointer',
              display: 'inline-block'
            }
          }, String(content));
        })
    };
  });

  var Intent = Cycle.createIntent(function (User) {
    return {
      refreshData$: User.event$('.innerRoot', 'click').map(function () { return 'x'; })
    };
  });

  User.inject(View).inject(Model).inject(Properties, Intent)[1].inject(User);

  return {
    wasRefreshed$: Intent.get('refreshData$').delay(500),
    contentOnRefresh$: Intent.get('refreshData$')
      .withLatestFrom(Model.get('content$'), function (x, y) { return y; }),
    fooOnRefresh$: Intent.get('refreshData$')
      .withLatestFrom(Model.get('foo$'), function (x, y) { return y; })
  };
});

var OuterModel = Cycle.createModel(function (Intent) {
  return {
    color$: Intent.get('changeColor$').startWith('#000000')
  };
});

var OuterView = Cycle.createView(function (Model) {
  return {
    vtree$: Model.get('color$')
      .map(function (color) {
        return h('div.outer', {
          style: {
            margin: '40px',
            border: '1px solid #323232',
            padding: '20px'}},
          [
            h('inner-elem.inner', {foo: 17, content: 153}),
            h('p', {style: {color: color}}, String(color)),
            h('p', '(Please check also the logs)')]);
      })
  };
});

var OuterUser = Cycle.createDOMUser('.js-container');

console.info('You should see both \'foo: ...\' and \'content: ...\' ' +
  'logs every time you click on the inner box.'
);
OuterUser.event$('.inner', 'fooOnRefresh').subscribe(function (ev) {
  console.log('foo: ' + ev.data);
});
OuterUser.event$('.inner', 'contentOnRefresh').subscribe(function (ev) {
  console.log('content: ' + ev.data);
});

var OuterIntent = Cycle.createIntent(function (User) {
  function makeRandomColor() {
    var hexColor = Math.floor(Math.random() * 16777215).toString(16);
    while (hexColor.length < 6) {
      hexColor = '0' + hexColor;
    }
    hexColor = '#' + hexColor;
    return hexColor;
  }

  return {
    changeColor$: User.event$('.inner', 'wasRefreshed').map(makeRandomColor)
  };
});

OuterUser
.inject(OuterView)
.inject(OuterModel)
.inject(OuterIntent)
.inject(OuterUser);
