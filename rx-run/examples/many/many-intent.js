var manyIntent = (function () {
  var addItem$ = Cycle.createStream(function (interactions$) {
    return Cycle.Rx.Observable.merge(
      interactions$.choose('.add-one-btn', 'click').map(function () { return 1; }),
      interactions$.choose('.add-many-btn', 'click').map(function () { return 1000; })
    );
  });

  var changeColor$ = Cycle.createStream(function (interactions$) {
    return interactions$.choose('.item', 'changeColor')
      .map(function (ev) { return ev.data; });
  });

  var changeWidth$ = Cycle.createStream(function (interactions$) {
    return interactions$.choose('.item', 'changeWidth')
      .map(function (ev) { return ev.data; });
  });

  var removeItem$ = Cycle.createStream(function (interactions$) {
    return interactions$.choose('.item', 'destroy')
      .map(function (ev) { return ev.data; });
  });

  return {
    addItem$: addItem$,
    changeColor$: changeColor$,
    changeWidth$: changeWidth$,
    removeItem$: removeItem$,
    inject: function inject(user) {
      addItem$.inject(user.interactions$);
      changeColor$.inject(user.interactions$);
      changeWidth$.inject(user.interactions$);
      removeItem$.inject(user.interactions$);
      return user;
    }
  };
})();
