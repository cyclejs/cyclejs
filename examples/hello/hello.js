var HelloModel = Cycle.defineModel(['changeName$'], function (intent) {
  return {
    name$: intent.changeName$.startWith('')
  };
});

var HelloView = Cycle.defineView(['name$'], function (model) {
  return {
    vtree$: model.name$
      .map(function (name) {
        return Cycle.h('div', {}, [
          Cycle.h('label', 'Name:'),
          Cycle.h('input', {
            'attributes': {'type': 'text'},
            'ev-input': 'inputText$'
          }),
          Cycle.h('hr'),
          Cycle.h('h1', 'Hello ' + name)
        ]);
      }),
    events: ['inputText$']
  };
});

var HelloIntent = Cycle.defineIntent(['inputText$'], function (view) {
  return {
    changeName$: view.inputText$
      .map(function (ev) { return ev.target.value; })
  };
});

Cycle.renderEvery(HelloView.vtree$, '.js-container');
Cycle.link(HelloModel, HelloView, HelloIntent);
