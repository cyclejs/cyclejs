var h = Cycle.h;

function manyComponent(ext) {
  var id$ = ext.get('props', 'itemid').shareReplay(1);
  var color$ = ext.get('props', 'color').startWith('#888').shareReplay(1);
  var width$ = ext.get('props', 'width').startWith(200).shareReplay(1);
  var vtree$ = Cycle.Rx.Observable
    .combineLatest(id$, color$, width$, function (id, color, width) {
      var style = {
        border: '1px solid #000',
        background: 'none repeat scroll 0% 0% ' + color,
        width: width + 'px',
        height: '70px',
        display: 'block',
        padding: '20px',
        margin: '10px 0px'
      };
      return h('div.item', {style: style}, [
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
    });
  var destroy$ = ext.get('dom', '.remove-btn', 'click')
    .withLatestFrom(id$, function (ev, id) { return id; });
  var changeColor$ = ext.get('dom', '.color-field', 'input')
    .withLatestFrom(id$, function (ev, id) {
      return {id: id, color: ev.currentTarget.value};
    });
  var changeWidth$ = ext.get('dom', '.width-slider', 'input')
    .withLatestFrom(id$, function (ev, id) {
      return {id: id, width: parseInt(ev.currentTarget.value)};
    });

  return {
    dom: vtree$,
    events: {
      destroy: destroy$,
      changeColor: changeColor$,
      changeWidth: changeWidth$
    }
  };
}
