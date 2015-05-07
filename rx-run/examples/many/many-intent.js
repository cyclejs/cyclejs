function manyIntent(interactions) {
  var addOneBtnClick$ = interactions.get('.add-one-btn', 'click');
  var addManyBtnClick$ = interactions.get('.add-many-btn', 'click');
  var addItem$ = Cycle.Rx.Observable.merge(
    addOneBtnClick$.map(function () { return 1; }),
    addManyBtnClick$.map(function () { return 1000; })
  );
  var changeColor$ = interactions.get('.item', 'changeColor')
    .map(function (ev) { return ev.data; });
  var changeWidth$ = interactions.get('.item', 'changeWidth')
    .map(function (ev) { return ev.data; });
  var removeItem$ = interactions.get('.item', 'destroy')
    .map(function (ev) { return ev.data; });

  return {
    addItem$: addItem$,
    changeColor$: changeColor$,
    changeWidth$: changeWidth$,
    removeItem$: removeItem$
  };
}
