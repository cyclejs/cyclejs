function computer(interactions) {
  return interactions.get('.myinput', 'input')
    .map(function (ev) { return ev.target.value; })
    .startWith('')
    .map(function (name) {
      return Cycle.h('div', [
        Cycle.h('label', 'Name:'),
        Cycle.h('input.myinput', {attributes: {type: 'text'}}),
        Cycle.h('hr'),
        Cycle.h('h1', 'Redirected text: ' + name)
      ]);
    })
    .flatMap(function (vtree) {
      return Cycle.Rx.Observable.just(vtree);
    });
}

Cycle.applyToDOM('.js-container', computer);
