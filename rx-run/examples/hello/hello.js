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

var interaction$ = Cycle.createStream(function user(vtree$) {
  return Cycle.render(vtree$, '.js-container').interaction$;
});

var changeName$ = Cycle.createStream(function intent(interaction$) {
  return interaction$.choose('.myinput', 'input').map(function (ev) {
    return ev.target.value;
  });
});

name$.inject(changeName$).inject(interaction$).inject(vtree$).inject(name$);
