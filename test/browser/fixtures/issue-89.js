'use strict';
let Cycle = require('../../../src/core/cycle');
let {Rx, h} = Cycle;

function myelement(interactions, props) {
  return {
    vtree$: props.get('content')
      .map(content => h('h3.myelementclass', content))
  };
}

function makeModelNumber$() {
  return Rx.Observable.merge(
    Rx.Observable.just(123).delay(50),
    Rx.Observable.just(456).delay(400)
  );
}

function viewWithContainerFn(number$) {
  return number$.map(number =>
    h('div', [
      h('myelement', {content: String(number)})
    ])
  );
}

function viewWithoutContainerFn(number$) {
  return number$.map(number =>
    h('myelement', {content: String(number)})
  );
}

module.exports = {
  myelement,
  makeModelNumber$,
  viewWithContainerFn,
  viewWithoutContainerFn
};
