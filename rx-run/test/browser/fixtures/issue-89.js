'use strict';
let Cycle = require('../../../src/cycle');
let {Rx, h} = Cycle;

function myelement(props$) {
  return {
    vtree$: props$.map(props => {
      console.log(props.content);
      return h('h3.myelementclass', String(props.content));
    })
  };
}

function makeModelNumber$() {
  return Rx.Observable.of(123, 456).controlled();
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
