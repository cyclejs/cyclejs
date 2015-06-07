function manyIntent(ext) {
  var addOneBtnClick$ = ext.get('dom', '.add-one-btn', 'click');
  var addManyBtnClick$ = ext.get('dom', '.add-many-btn', 'click');
  var addItem$ = Cycle.Rx.Observable.merge(
    addOneBtnClick$.map(function () { return 1; }),
    addManyBtnClick$.map(function () { return 1000; })
  );
  var changeColor$ = ext.get('dom', '.item', 'changeColor')
    .map(function (ev) { return ev.detail; });
  var changeWidth$ = ext.get('dom', '.item', 'changeWidth')
    .map(function (ev) { return ev.detail; });
  var removeItem$ = ext.get('dom', '.item', 'destroy')
    .map(function (ev) { return ev.detail; });

  return {
    addItem$: addItem$,
    changeColor$: changeColor$,
    changeWidth$: changeWidth$,
    removeItem$: removeItem$
  };
}
