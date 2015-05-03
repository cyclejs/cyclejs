function manyIntentFactory() {
  var Subject = Cycle.Rx.Subject;

  var addOneBtnClick$ = new Subject();
  var addManyBtnClick$ = new Subject();
  var addItem$ = Cycle.Rx.Observable.merge(
    addOneBtnClick$.map(function () { return 1; }),
    addManyBtnClick$.map(function () { return 1000; })
  );

  var changeColorSource$ = new Subject();
  var changeColor$ = changeColorSource$
    .map(function (ev) { return ev.data; });

  var changeWidthSource$ = new Subject();
  var changeWidth$ = changeWidthSource$
    .map(function (ev) { return ev.data; });

  var removeItemSource$ = new Subject();
  var removeItem$ = removeItemSource$
    .map(function (ev) { return ev.data; });

  function interactionChooser(interactions) {
    interactions.choose('.add-one-btn', 'click')
      .multicast(addOneBtnClick$)
      .connect();
    interactions.choose('.add-many-btn', 'click')
      .multicast(addManyBtnClick$)
      .connect();
    interactions.choose('.item', 'changeColor')
      .multicast(changeColorSource$)
      .connect();
    interactions.choose('.item', 'changeWidth')
      .multicast(changeWidthSource$)
      .connect();
    interactions.choose('.item', 'destroy')
      .multicast(removeItemSource$)
      .connect();
  }

  return {
    addItem$: addItem$,
    changeColor$: changeColor$,
    changeWidth$: changeWidth$,
    removeItem$: removeItem$,
    interactionChooser: interactionChooser
  };
}
