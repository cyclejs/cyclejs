'use strict';
let Rx = require('rx');
let {render} = require('./render');

// TODO: test
module.exports = function applyToDOM(computerFn, selector, customElements) {
  let vtreeSubject$ = new Rx.AsyncSubject();
  let reactiveNode = render(
    vtreeSubject$.mergeAll(),
    selector,
    customElements
  );

  let subscription = reactiveNode.connect();

  let vtree$ = computerFn(reactiveNode.interactions);
  vtreeSubject$.onNext(vtree$);
  vtreeSubject$.onCompleted();
  vtreeSubject$.dispose();

  return new Rx.CompositeDisposable(subscription, vtreeSubject$);
};
