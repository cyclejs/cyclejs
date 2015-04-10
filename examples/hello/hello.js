var h = Cycle.h;
var Rx = Cycle.Rx;

var name$ = Cycle.createStream(function model(changeName$) {
  return changeName$.startWith('');
});

var vtree$ = Cycle.createStream(function view(name$) {
  return name$.map(function (name) {
    return h('div', [
      h('label', 'Name:'),
      h('input.myinput', {attributes: {type: 'text'}}),
      h('hr'),
      h('h1', 'Hello ' + name)
    ]);
  });
});

var interactions$ = Cycle.createStream(function user(vtree$) {
  return Cycle.render(vtree$, '.js-container').interactions$;
});

var changeName$ = Cycle.createStream(function intent(interactions$) {
  return interactions$.choose('.myinput', 'input').map(function (ev) {
    return ev.target.value;
  });
});

interactions$.inject(vtree$).inject(name$).inject(changeName$).inject(interactions$);
