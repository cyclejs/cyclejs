'use strict';
let Cycle = require('../../../src/cycle');
let {Rx, h} = Cycle;

function myelement(rootElem$, props) {
  let vtree$ = Cycle.createStream(function (content$) {
    // TODO these tests should not require shareReplay(1)! Remove and fix src/
    return content$.map(content => h('h3.myelementclass', content)).shareReplay(1);
  });
  rootElem$.inject(vtree$).inject(props.get('content$'));
}

function makeModelNumber$() {
  return Rx.Observable.merge(
    Rx.Observable.just(123).delay(50),
    Rx.Observable.just(456).delay(200)
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
