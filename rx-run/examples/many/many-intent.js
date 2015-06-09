function manyIntent(ext) {
  var addOneBtnClick$ = ext.get('DOM', '.add-one-btn', 'click');
  var addManyBtnClick$ = ext.get('DOM', '.add-many-btn', 'click');
  var addItem$ = Cycle.Rx.Observable.merge(
    addOneBtnClick$.map(function () { return 1; }),
    addManyBtnClick$.map(function () { return 1000; })
  );
  var changeColor$ = ext.get('DOM', '.item', 'changeColor')
    .map(function (ev) { return ev.detail; });
  var changeWidth$ = ext.get('DOM', '.item', 'changeWidth')
    .map(function (ev) { return ev.detail; });
  var removeItem$ = ext.get('DOM', '.item', 'destroy')
    .map(function (ev) { return ev.detail; });

  return {
    addItem$: addItem$,
    changeColor$: changeColor$,
    changeWidth$: changeWidth$,
    removeItem$: removeItem$
  };
}
