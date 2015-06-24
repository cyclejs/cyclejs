function manyIntent(ext) {
  var addOneBtnClick$ = ext.DOM.get('.add-one-btn', 'click');
  var addManyBtnClick$ = ext.DOM.get('.add-many-btn', 'click');
  var addItem$ = Cycle.Rx.Observable.merge(
    addOneBtnClick$.map(function () { return 1; }),
    addManyBtnClick$.map(function () { return 1000; })
  );
  var changeColor$ = ext.DOM.get('.item', 'changeColor')
    .map(function (ev) { return ev.detail; });
  var changeWidth$ = ext.DOM.get('.item', 'changeWidth')
    .map(function (ev) { return ev.detail; });
  var removeItem$ = ext.DOM.get('.item', 'destroy')
    .map(function (ev) { return ev.detail; });

  return {
    addItem$: addItem$,
    changeColor$: changeColor$,
    changeWidth$: changeWidth$,
    removeItem$: removeItem$
  };
}
