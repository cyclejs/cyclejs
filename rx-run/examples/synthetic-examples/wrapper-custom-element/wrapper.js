var h = Cycle.h;
var Rx = Cycle.Rx;

Cycle.registerCustomElement('wrapper-element', function (user, props) {
  var view = Cycle.createView(function (props) {
    return {
      vtree$: props.get('children$').map(function (children) {
        return h('div.wrapper', {style: {backgroundColor: 'lightgray'}}, children);
      })
    };
  });

  user.inject(view).inject(props);
});

var view = Cycle.createView(function () {
  return {
    vtree$: Rx.Observable.just(
      h('div.everything', [
        h('wrapper-element', {key: 1}, [
          h('h3', 'I am supposed to be inside a gray box.')
        ])
      ])
    )
  };
});

var user = Cycle.createDOMUser('.js-container');

user.inject(view);
