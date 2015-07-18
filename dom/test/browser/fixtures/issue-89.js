'use strict';
let Cycle = require('@cycle/core');
let CycleDOM = require('../../../src/cycle-dom');
let {Rx} = Cycle;
let {h} = CycleDOM;

function myElement(ext) {
  return {
    DOM: ext.props.get('content')
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
