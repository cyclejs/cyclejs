var h = Cycle.h;

var FooModel = Cycle.defineModel(['requestNewBar$'], function (intent) {
  return {
    foo$: intent.requestNewBar$
      .map(function () {
        return {id: 2, bar: Math.round(Math.random() * 1000)};
      })
      .startWith({id: 2, bar: 135})
  };
});

var FooView = Cycle.defineView(['foo$'], function (model) {
  return {
    vtree$: model.foo$
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
      }),
    events: ['fooClicks$']
  };
});

var FooIntent = Cycle.defineIntent(['fooClicks$'], function (view) {
  return {
    requestNewBar$: view.fooClicks$.map(function () { return 'x'; })
  };
});

var BarModel = FooModel.clone();
var BarView = FooView.clone();
var BarIntent = FooIntent.clone();

Cycle.renderEvery(FooView.vtree$, '.js-container1');
Cycle.renderEvery(BarView.vtree$, '.js-container2');
Cycle.circularInject(FooModel, FooView, FooIntent);
Cycle.circularInject(BarModel, BarView, BarIntent);
