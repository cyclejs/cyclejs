var h = Cycle.h;
var Rx = Cycle.Rx;

Cycle.registerCustomElement('wrapper-element', function (rootElem$, props) {
  var vtree$ = Cycle.createStream(function (children$) {
    return children$.map(function (children) {
      return h('div.wrapper', {style: {backgroundColor: 'lightgray'}}, children);
    });
  });

  rootElem$.inject(vtree$).inject(props.get('children$'));
});

var vtree$ = Rx.Observable.just(
  h('div.everything', [
    h('wrapper-element', {key: 1}, [
      h('h3', 'I am supposed to be inside a gray box.')
    ])
  ])
);

Cycle.render(vtree$, '.js-container');
