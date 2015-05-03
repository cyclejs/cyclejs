var h = Cycle.h;
var Rx = Cycle.Rx;

function applyToDOM(computerFn, selector, customElements) {
  var vtree$ = Cycle.createStream(function (interaction$) {
    return computerFn(interaction$);
  });
  var reactiveNode = Cycle.render(
    vtree$,
    selector,
    customElements
  );
  vtree$.inject(reactiveNode.interactions)

  return reactiveNode.connect();
}

function computer(interaction$) {
  return interaction$
    .choose('.field', 'input')
    .map(function (ev) {
      return ev.target.value;
    })
    .startWith('')
    .map(function (name) {
      return h('div', [
        h('label', 'Name:'),
        h('input.field', {attributes: {type: 'text'}}),
        h('h1.header', `Hello ${name}`)
      ]);
    });
}

applyToDOM(computer, '.js-container');
