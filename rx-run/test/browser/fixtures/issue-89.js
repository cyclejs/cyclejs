'use strict';
let Cycle = require('../../../src/cycle');
let {Rx, h} = Cycle;

function myelement(user, props) {
  var view = Cycle.createView(function (props) {
    return {
      vtree$: props.get('content$').map(content => h('h3.myelementclass', content))
    };
  });
  user.inject(view).inject(props);
}

function modelFn() {
  return {
    number$: Rx.Observable.merge(
      Rx.Observable.just(123).delay(50),
      Rx.Observable.just(456).delay(200)
    )
  };
}

function viewWithContainerFn(model) {
  return {
    vtree$: model.get('number$').map(number =>
      h('div', [
        h('myelement', {content: String(number)})
      ])
    )
  };
}

function viewWithoutContainerFn(model) {
  return {
    vtree$: model.get('number$').map(number =>
      h('myelement', {content: String(number)})
    )
  };
}

module.exports = {
  myelement: myelement,
  modelFn: modelFn,
  viewWithContainerFn: viewWithContainerFn,
  viewWithoutContainerFn: viewWithoutContainerFn
};
