var manyIntent = (function () {
  var addItem$ = Cycle.createStream(function (interaction$) {
    return Cycle.Rx.Observable.merge(
      interaction$.choose('.add-one-btn', 'click').map(function () { return 1; }),
      interaction$.choose('.add-many-btn', 'click').map(function () { return 1000; })
    );
  });

  var changeColor$ = Cycle.createStream(function (interaction$) {
    return interaction$.choose('.item', 'changeColor')
      .map(function (ev) { return ev.data; });
  });

  var changeWidth$ = Cycle.createStream(function (interaction$) {
    return interaction$.choose('.item', 'changeWidth')
      .map(function (ev) { return ev.data; });
  });

  var removeItem$ = Cycle.createStream(function (interaction$) {
    return interaction$.choose('.item', 'destroy')
      .map(function (ev) { return ev.data; });
  });

  return {
    addItem$: addItem$,
    changeColor$: changeColor$,
    changeWidth$: changeWidth$,
    removeItem$: removeItem$,
    inject: function inject(user) {
      addItem$.inject(user.interaction$);
      changeColor$.inject(user.interaction$);
      changeWidth$.inject(user.interaction$);
      removeItem$.inject(user.interaction$);
      return user;
    }
  };
})();
