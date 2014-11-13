/**
 * Created by amed on 13.11.14.
 */

var ViewInterface = ['addOneClicks$', 'addManyClicks$', 'removeClicks$',
  'itemColorChanged$', 'itemWidthChanged$'
];

var ManyIntent = Cycle.defineIntent(ViewInterface, function (view) {
  return {
    addItem$: Cycle.Rx.Observable.merge(
      view.addOneClicks$.map(function () { return 1; }),
      view.addManyClicks$.map(function () { return 1000; })
    ),

    removeItem$: view.removeClicks$.map(function (clickEvent) {
      return Number(clickEvent.currentTarget.attributes['data-item-id'].value);
    }),

    changeColor$: view.itemColorChanged$
      .map(function (inputEvent) {
        return {
          id: Number(inputEvent.currentTarget.attributes['data-item-id'].value),
          color: inputEvent.currentTarget.value
        };
      }),

    changeWidth$: view.itemWidthChanged$
      .map(function (inputEvent) {
        return {
          id: Number(inputEvent.currentTarget.attributes['data-item-id'].value),
          width: Number(inputEvent.currentTarget.value)
        };
      })
  };
});

