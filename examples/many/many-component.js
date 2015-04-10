var h = Cycle.h;

Cycle.registerCustomElement('item', function (rootElem$, props) {
  var model = (function () {
    var id$ = Cycle.createStream(function (itemid$) {
      return itemid$.shareReplay(1);
    });
    var color$ = Cycle.createStream(function (color$) {
      return color$.startWith('#888');
    });
    var width$ = Cycle.createStream(function (width$) {
      return width$.startWith(200);
    });

    return {
      id$: id$,
      color$: color$,
      width$: width$,
      inject: function inject(props, intent) {
        id$.inject(props.get('itemid$'));
        color$.inject(props.get('color$'));
        width$.inject(props.get('width$'));
        return [props, intent];
      }
    };
  })();

  var view = (function () {
    var vtree$ = Cycle.createStream(function (id$, color$, width$) {
      return Cycle.Rx.Observable.combineLatest(id$, color$, width$,
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
      );
    });

    return {
      vtree$: vtree$,
      inject: function inject(model) {
        vtree$.inject(model.id$, model.color$, model.width$);
        return model;
      }
    };
  })();

  var user = (function () {
    return {
      interaction$: rootElem$.interaction$,
      inject: function inject(view) {
        rootElem$.inject(view.vtree$);
        return view;
      }
    };
  })();

  var intent = (function () {
    var destroy$ = Cycle.createStream(function (interaction$) {
      return interaction$.choose('.remove-btn', 'click');
    });
    var changeColor$ = Cycle.createStream(function (interaction$) {
      return interaction$.choose('.color-field', 'input');
    });
    var changeWidth$ = Cycle.createStream(function (interaction$) {
      return interaction$.choose('.width-slider', 'input');
    });

    return {
      destroy$: destroy$,
      changeColor$: changeColor$,
      changeWidth$: changeWidth$,
      inject: function inject(user) {
        destroy$.inject(user.interaction$);
        changeColor$.inject(user.interaction$);
        changeWidth$.inject(user.interaction$);
        return user;
      }
    };
  })();

  user.inject(view).inject(model).inject(props, intent)[1].inject(user);

  return {
    destroy$: intent.destroy$
      .withLatestFrom(model.id$, function (ev, id) { return id; }),

    changeColor$: intent.changeColor$
      .withLatestFrom(model.id$, function (ev, id) {
        return {id: id, color: ev.currentTarget.value};
      }),

    changeWidth$: intent.changeWidth$
      .withLatestFrom(model.id$, function (ev, id) {
        return {id: id, width: parseInt(ev.currentTarget.value)};
      })
  };
});
