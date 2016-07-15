'use strict';
let Cycle = require('@cycle/rxjs-run');
let CycleDOM = require('../../../lib/index');
let Rx = require('rxjs');
let {h} = CycleDOM;

function myElement(content) {
  return Rx.Observable.of(content).map(content =>
    h('h3.myelementclass', content)
  );
}

function makeModelNumber$() {
  return Rx.Observable.merge(
    Rx.Observable.of(123).delay(50),
    Rx.Observable.of(456).delay(100)
  );
}

function viewWithContainerFn(number$) {
  return number$.map(number =>
    h('div', [
      myElement(String(number))
    ])
  );
}

function viewWithoutContainerFn(number$) {
  return number$.map(number =>
    myElement(String(number))
  );
}

module.exports = {
  myElement,
  makeModelNumber$,
  viewWithContainerFn,
  viewWithoutContainerFn
};
