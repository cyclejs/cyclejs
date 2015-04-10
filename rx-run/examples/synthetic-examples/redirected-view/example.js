var name$ = Cycle.createStream(function (changeName$) {
  return changeName$.startWith('');
});

var vtree$ = Cycle.createStream(function (name$) {
  return name$.map(function (name) {
    return Cycle.h('div', [
      Cycle.h('label', 'Name:'),
      Cycle.h('input.myinput', {attributes: {type: 'text'}}),
      Cycle.h('hr'),
      Cycle.h('h1', 'Redirected text: ' + name)
    ]);
  });
});

var proxyVtree$ = Cycle.createStream(function (vtree$) {
  return vtree$.replay(null, 1).refCount();
});

var interaction$ = Cycle.createStream(function (vtree$) {
  return Cycle.render(vtree$, '.js-container').interaction$;
});

var changeName$ = Cycle.createStream(function (interaction$) {
  return interaction$.choose('.myinput', 'input')
    .map(function (ev) { return ev.target.value; });
});

interaction$
.inject(proxyVtree$)
.inject(vtree$)
.inject(name$)
.inject(changeName$)
.inject(interaction$);
