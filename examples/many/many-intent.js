var ManyIntent = Cycle.createIntent(function (view) {
  return {
    addItem$: Cycle.Rx.Observable.merge(
      view.get('addOneClicks$').map(function () { return 1; }),
      view.get('addManyClicks$').map(function () { return 1000; })
    ),

    removeItem$: view.get('removeClicks$').map(function (clickEvent) {
      return Number(clickEvent.currentTarget.attributes['data-item-id'].value);
    }),

    changeColor$: view.get('itemColorChanged$')
      .map(function (inputEvent) {
        return {
          id: Number(inputEvent.currentTarget.attributes['data-item-id'].value),
          color: inputEvent.currentTarget.value
        };
      }),

    changeWidth$: view.get('itemWidthChanged$')
      .map(function (inputEvent) {
        return {
          id: Number(inputEvent.currentTarget.attributes['data-item-id'].value),
          width: Number(inputEvent.currentTarget.value)
        };
      })
  };
});
