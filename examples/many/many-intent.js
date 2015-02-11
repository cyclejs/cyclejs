var ManyIntent = Cycle.createIntent(function (User) {
  return {
    addItem$: Cycle.Rx.Observable.merge(
      User.event$('.add-one-btn', 'click').map(function () { return 1; }),
      User.event$('.add-many-btn', 'click').map(function () { return 1000; })
    ),

    changeColor$: User.event$('.color-field', 'input')
      .map(function (inputEvent) {
        return {
          id: Number(inputEvent.currentTarget.attributes['data-item-id'].value),
          color: inputEvent.currentTarget.value
        };
      }),

    changeWidth$: User.event$('.width-slider', 'input')
      .map(function (inputEvent) {
        return {
          id: Number(inputEvent.currentTarget.attributes['data-item-id'].value),
          width: Number(inputEvent.currentTarget.value)
        };
      }),

    removeItem$: User.event$('.remove-btn', 'click').map(function (clickEvent) {
      return Number(clickEvent.currentTarget.attributes['data-item-id'].value);
    })
  };
});
