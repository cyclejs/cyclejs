var h = Cycle.h;

function fooModelDefintion(Intent) {
  return {
    data$: Intent.get('refreshData$')
      .map(function () { return Math.round(Math.random() * 1000); })
      .startWith(135)
  };
}

function fooViewDefinition(Model) {
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
}

function fooIntentDefinition(User) {
  return {
    refreshData$: User.event$('.box', 'click').map(function () { return 'x'; })
  };
}

var FooModel = Cycle.createModel(fooModelDefintion);

var FooView = Cycle.createView(fooViewDefinition);

var FooUser = Cycle.createDOMUser('.js-container1');

var FooIntent = Cycle.createIntent(fooIntentDefinition);

var BarModel = Cycle.createModel(fooModelDefintion);
var BarView = Cycle.createView(fooViewDefinition);
var BarUser = Cycle.createDOMUser('.js-container2');
var BarIntent = Cycle.createIntent(fooIntentDefinition);

FooUser.inject(FooView).inject(FooModel).inject(FooIntent).inject(FooUser);
BarUser.inject(BarView).inject(BarModel).inject(BarIntent).inject(BarUser);
