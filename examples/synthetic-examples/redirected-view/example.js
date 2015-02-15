var HelloModel = Cycle.createModel(function (Intent) {
  return {name$: Intent.get('changeName$').startWith('')};
});

var HelloView = Cycle.createView(function (Model) {
  return {
    vtree$: Model.get('name$')
      .map(function (name) {
        return Cycle.h('div', {}, [
          Cycle.h('label', 'Name:'),
          Cycle.h('input.myinput', {attributes: {type: 'text'}}),
          Cycle.h('hr'),
          Cycle.h('h1', 'Redirected text: ' + name)
        ]);
      })
  };
});

var ProxyView = Cycle.createView(function (View) {
  return {
    vtree$: View.get('vtree$')
  };
});

var HelloUser = Cycle.createDOMUser('.js-container');

var HelloIntent = Cycle.createIntent(function (User) {
  return {
    changeName$: User.event$('.myinput', 'input')
      .map(function (ev) { return ev.target.value; })
  };
});

HelloUser
.inject(ProxyView)
.inject(HelloView)
.inject(HelloModel)
.inject(HelloIntent)
.inject(HelloUser);
