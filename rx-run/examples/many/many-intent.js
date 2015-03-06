var ManyIntent = Cycle.createIntent(function (User) {
  return {
    addItem$: Cycle.Rx.Observable.merge(
      User.event$('.add-one-btn', 'click').map(function () { return 1; }),
      User.event$('.add-many-btn', 'click').map(function () { return 1000; })
    ),

    changeColor$: User.event$('.item', 'changeColor').map(function (ev) {
      return ev.data;
    }),

    changeWidth$: User.event$('.item', 'changeWidth').map(function (ev) {
        return ev.data;
      }),

    removeItem$: User.event$('.item', 'destroy').map(function (ev) {
      return ev.data;
    })
  };
});
