var Rx = Cycle.Rx;
var h = CycleDOM.h;

function wrapperElementDef(ext) {
  return {
    DOM: ext.props.get('children')
      .map(function (children) {
        return h('div.wrapper', {style: {backgroundColor: '#aaa'}}, children);
      })
  };
}

function main() {
  return {
    DOM: Rx.Observable.just(
      h('div.everything', [
        h('wrapper-element', {key: 1}, [
          h('h3', 'I am supposed to be inside a gray box.')
        ])
      ])
    )
  };
}

Cycle.run(main, {
  DOM: CycleDOM.makeDOMDriver('.js-container', {
    'wrapper-element': wrapperElementDef
  })
});
