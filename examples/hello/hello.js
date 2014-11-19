var HelloModel = Cycle.createModel(['changeName$'], function (intent) {
  return {
    name$: intent.changeName$.startWith('')
  };
});

var HelloView = Cycle.createView(['name$'], function (model) {
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

var HelloIntent = Cycle.createIntent(['inputText$'], function (view) {
  return {
    changeName$: view.inputText$
      .map(function (ev) { return ev.target.value; })
  };
});

Cycle.createRenderer('.js-container').inject(HelloView);
Cycle.circularInject(HelloModel, HelloView, HelloIntent);
