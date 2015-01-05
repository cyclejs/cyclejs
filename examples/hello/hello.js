var HelloModel = Cycle.createModel(function (intent) {
  return {name$: intent.get('changeName$').startWith('')};
});

var HelloView = Cycle.createView(function (model) {
  return {
    vtree$: model.get('name$')
      .map(function (name) {
        return Cycle.h('div', {}, [
          Cycle.h('label', 'Name:'),
          Cycle.h('input', {
            attributes: {type: 'text'},
            oninput: 'inputText$'
          }),
          Cycle.h('hr'),
          Cycle.h('h1', 'Hello ' + name)
        ]);
      })
  };
});

var HelloIntent = Cycle.createIntent(function (view) {
  return {
    changeName$: view.get('inputText$')
      .map(function (ev) { return ev.target.value; })
  };
});

HelloIntent.inject(HelloView).inject(HelloModel).inject(HelloIntent);
Cycle.createRenderer('.js-container').inject(HelloView);
