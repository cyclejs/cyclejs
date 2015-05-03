var h = Cycle.h;

function manyComponent(props$, interactions) {
  var model = {
    id$: props$.map(function (p) {
      return p.itemid;
    }),
    color$: props$.map(function (p) {
      return p.color;
    }).startWith('#888'),
    width$: props$.map(function (p) {
      return p.width;
    }).startWith(200)
  };
  var vtree$ = Cycle.Rx.Observable
    .combineLatest(model.id$, model.color$, model.width$,
      function (id, color, width) {
        var props = {
          style: {
            border: '1px solid #000',
            background: 'none repeat scroll 0% 0% ' + color,
            width: width + 'px',
            height: '70px',
            display: 'block',
            padding: '20px',
            margin: '10px 0px'
          }
        };
        return h('div.item', props, [
          h('input.color-field', {
            type: 'text',
            attributes: {'data-item-id': id, value: color}
          }),
          h('div.slider-container', [
            h('input.width-slider', {
              type: 'range', min: '200', max: '1000',
              attributes: {'data-item-id': id, value: width}
            })
          ]),
          h('div.width-content', String(width)),
          h('button.remove-btn', {attributes: {'data-item-id': id}}, 'Remove')
        ]);
      }
    );
  var events = {
    destroy$: interactions.choose('.remove-btn', 'click')
      .withLatestFrom(model.id$, function (ev, id) { return id; }),

    changeColor$: interactions.choose('.color-field', 'input')
      .withLatestFrom(model.id$, function (ev, id) {
        return {id: id, color: ev.currentTarget.value};
      }),

    changeWidth$: interactions.choose('.width-slider', 'input')
      .withLatestFrom(model.id$, function (ev, id) {
        return {id: id, width: parseInt(ev.currentTarget.value)};
      })
  };

  return {
    vtree$: vtree$,
    events: events
  };
}
