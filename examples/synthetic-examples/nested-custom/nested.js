var h = Cycle.h;

Cycle.registerCustomElement('inner-elem', function (User, Properties) {
  var InnerModel = Cycle.createModel(function (Intent) {
    return {
      data$: Intent.get('refreshData$')
        .map(function () { return Math.round(Math.random() * 1000); })
        .startWith(135)
    };
  });

  var InnerView = Cycle.createView(function (Model) {
    return {
      vtree$: Model.get('data$')
        .map(function (data) {
          return h('div.innerRoot', {
            style: {
              margin: '10px',
              background: '#ececec',
              padding: '5px',
              cursor: 'pointer',
              display: 'inline-block'
            }
          }, String(data));
        })
    };
  });

  var InnerIntent = Cycle.createIntent(function (User) {
    return {
      refreshData$: User.event$('.innerRoot', 'click').map(function () { return 'x'; })
    };
  });

  User.inject(InnerView).inject(InnerModel).inject(InnerIntent).inject(User);

  return {
    myevent$: InnerIntent.get('refreshData$').delay(500)
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
            h('inner-elem.inner'),
            h('p', {style: {color: color}}, String(color)) ]);
      })
  };
});

var OuterUser = Cycle.createDOMUser('.js-container');

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
    changeColor$: User.event$('.inner', 'myevent').map(makeRandomColor)
  };
});

OuterUser
.inject(OuterView)
.inject(OuterModel)
.inject(OuterIntent)
.inject(OuterUser);
