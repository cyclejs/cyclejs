'use strict';
let Cycle = require('../../../src/core/cycle');
let {Rx, h} = Cycle;

function myElement(ext) {
  return {
    dom: ext.get('props', 'content')
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
      h('my-element', {content: String(number)})
    ])
  );
}

function viewWithoutContainerFn(number$) {
  return number$.map(number =>
    h('my-element', {content: String(number)})
  );
}

module.exports = {
  myElement,
  makeModelNumber$,
  viewWithContainerFn,
  viewWithoutContainerFn
};
