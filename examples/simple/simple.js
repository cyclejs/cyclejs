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

Cycle.renderEvery(FooView.vtree$, '.js-container');
Cycle.link(FooModel, FooView, FooIntent);
