var h = Cycle.h;

var FooModel = Cycle.createModel(function (intent) {
  return {
    foo$: intent.get('requestNewBar$')
      .map(function () {
        return {id: 2, bar: Math.round(Math.random() * 1000)};
      })
      .startWith({id: 2, bar: 135})
  };
});

var FooView = Cycle.createView(function (model) {
  return {
    vtree$: model.get('foo$')
      .map(function (fooData) {
        return h('div', {
          'attributes': {'data-foo-id': fooData.id},
          'style': {
            'margin': '10px',
            'background': '#ececec',
            'padding': '5px',
            'cursor': 'pointer',
            'display': 'inline-block'
          },
          'ev-click': 'fooClicks$'
        }, String(fooData.bar));
      })
  };
});

var FooIntent = Cycle.createIntent(function (view) {
  return {
    requestNewBar$: view.get('fooClicks$').map(function () { return 'x'; })
  };
});

var BarModel = FooModel.clone();
var BarView = FooView.clone();
var BarIntent = FooIntent.clone();

Cycle.createRenderer('.js-container1').inject(FooView);
Cycle.createRenderer('.js-container2').inject(BarView);
FooIntent.inject(FooView).inject(FooModel).inject(FooIntent);
BarIntent.inject(BarView).inject(BarModel).inject(BarIntent);
