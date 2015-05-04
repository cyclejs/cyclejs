var h = Cycle.h;
var Rx = Cycle.Rx;

Cycle.registerCustomElement('wrapper-element', function (interactions, props) {
  return props.get('children')
    .map(function (children) {
      return h('div.wrapper', {style: {backgroundColor: 'lightgray'}}, children);
    });
});

Cycle.applyToDOM('.js-container', function computer() {
  return Rx.Observable.just(
    h('div.everything', [
      h('wrapper-element', {key: 1}, [
        h('h3', 'I am supposed to be inside a gray box.')
      ])
    ])
  );
});
