var h = Cycle.h;

Cycle.registerCustomElement('item', function (User, Properties) {
  var Model = Cycle.createModel(function (Intent, Properties) {
    return {
      id$:    Properties.get('itemid$').shareReplay(1),
      color$: Properties.get('color$').startWith('#888'),
      width$: Properties.get('width$').startWith(200)
    };
  });

  var View = Cycle.createView(function (Model) {
    return {
      vtree$: Cycle.Rx.Observable.combineLatest(
        Model.get('id$'),
        Model.get('color$'),
        Model.get('width$'),
        function (id, color, width) {
          return h('div.item', {
              style: {
                border: '1px solid #000',
                background: 'none repeat scroll 0% 0% ' + color,
                width: width + 'px',
                height: '70px',
                display: 'block',
                padding: '20px',
                margin: '10px 0px'
              }
            }, [
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
            ]
          );
        }
      )
    };
  });

  var Intent = Cycle.createIntent(function (User) {
    return {
      destroy$: User.event$('.remove-btn', 'click'),
      changeColor$: User.event$('.color-field', 'input'),
      changeWidth$: User.event$('.width-slider', 'input')
    };
  });

  User.inject(View).inject(Model).inject(Intent, Properties)[0].inject(User);

  return {
    destroy$: Intent.get('destroy$')
      .withLatestFrom(Model.get('id$'), function (ev, id) { return id; }),

    changeColor$: Intent.get('changeColor$')
      .withLatestFrom(Model.get('id$'), function (ev, id) {
        return {id: id, color: ev.currentTarget.value};
      }),

    changeWidth$: Intent.get('changeWidth$')
      .withLatestFrom(Model.get('id$'), function (ev, id) {
        return {id: id, width: parseInt(ev.currentTarget.value)};
      })
  };
});
