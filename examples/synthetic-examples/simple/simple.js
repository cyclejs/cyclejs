var h = Cycle.h;

var FooModel = Cycle.createModel(function (Intent) {
  return {
    data$: Intent.get('refreshData$')
      .map(function () { return Math.round(Math.random() * 1000); })
      .startWith(135)
  };
});

var FooView = Cycle.createView(function (Model) {
  return {
    vtree$: Model.get('data$')
      .map(function (data) {
        return h('div.box', {
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

var FooUser = Cycle.createDOMUser('.js-container1');

var FooIntent = Cycle.createIntent(function (User) {
  return {
    refreshData$: User.event$('.box', 'click').map(function () { return 'x'; })
  };
});

var BarModel = FooModel.clone();
var BarView = FooView.clone();
var BarUser = Cycle.createDOMUser('.js-container2');
var BarIntent = FooIntent.clone();

FooUser.inject(FooView).inject(FooModel).inject(FooIntent).inject(FooUser);
BarUser.inject(BarView).inject(BarModel).inject(BarIntent).inject(BarUser);
