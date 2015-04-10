var h = Cycle.h;
var Rx = Cycle.Rx;

Cycle.registerCustomElement('ticker', function (rootElem$, props) {
  var model = (function () {
    var color$ = Cycle.createStream(function (color$, stop$) {
      return Rx.Observable.merge(
        color$.takeUntil(stop$),
        stop$.map(function () { return '#FF0000'; })
      );
    });

    var x$ = Cycle.createStream(function (stop$) {
      return Rx.Observable.interval(50).startWith(0).takeUntil(stop$);
    });
    var y$ = Cycle.createStream(function (stop$) {
      return Rx.Observable.interval(100).startWith(0).takeUntil(stop$);
    });

    return {
      color$: color$,
      x$: x$,
      y$: y$,
      inject: function inject(props, intent) {
        color$.inject(props.get('color$'), intent.stop$);
        x$.inject(intent.stop$);
        y$.inject(intent.stop$);
        return [props, intent];
      }
    };
  })();

  var view = (function () {
    var vtree$ = Cycle.createStream(function (color$, x$, y$) {
      return Rx.Observable.combineLatest(color$, x$, y$, function (color, x, y) {
        return h('div.ticker', {
          style: {color: color, backgroundColor: '#ECECEC'}
        }, [
          h('h4', 'x' + x + ' ' + color),
          h('h1', 'Y' + y + ' ' + color),
          h('button.remove-btn', {onclick: 'removeClick$'}, 'Remove')
        ]);
      });
    });

    return {
      vtree$: vtree$,
      inject: function inject(model) {
        vtree$.inject(model.color$, model.x$, model.y$);
        return model;
      }
    };
  })();

  var user = (function () {
    return {
      interactions$: rootElem$.interactions$,
      inject: function inject(view) {
        rootElem$.inject(view.vtree$);
        return view;
      }
    };
  })();

  var intent = (function () {
    var removeClicks$ = Cycle.createStream(function (interactions$) {
      return interactions$.choose('.remove-btn', 'click');
    });
    var stop$ = removeClicks$.map(function () { return 'stop'; });
    var remove$ = removeClicks$.map(function () { return 'remove'; }).delay(500);

    return {
      stop$: stop$,
      remove$: remove$,
      inject: function inject(user) {
        removeClicks$.inject(user.interactions$);
        return user;
      }
    };
  })();

  user.inject(view).inject(model).inject(props, intent)[1].inject(user);

  return {
    remove$: intent.remove$
  };
});

var model = (function () {
  function makeRandomColor() {
    var hexColor = Math.floor(Math.random() * 16777215).toString(16);
    while (hexColor.length < 6) {
      hexColor = '0' + hexColor;
    }
    hexColor = '#' + hexColor;
    return hexColor;
  }

  var color$ = Rx.Observable.interval(1000)
    .map(makeRandomColor)
    .startWith('#000000');

  var tickerExists$ = Cycle.createStream(function (removeTicker$) {
    return Rx.Observable.just(true)
      .merge(removeTicker$.map(function () { return false; }));
  });

  return {
    color$: color$,
    tickerExists$: tickerExists$,
    inject: function inject(intent) {
      tickerExists$.inject(intent.removeTicker$);
      return intent;
    }
  };
})();

var view = (function () {
  var vtree$ = Cycle.createStream(function (color$, tickerExists$) {
    return Rx.Observable.combineLatest(color$, tickerExists$,
      function (color, tickerExists) {
        return h('div#the-view', [
          tickerExists ? h('ticker.ticker', {key: 1, color: color}) : null
        ]);
      }
    );
  });

  return {
    vtree$: vtree$,
    inject: function inject(model) {
      vtree$.inject(model.color$, model.tickerExists$);
      return model;
    }
  };
})();

var user = (function () {
  var interactions$ = Cycle.createStream(function (vtree$) {
    return Cycle.render(vtree$, '.js-container').interactions$;
  });

  return {
    interactions$: interactions$,
    inject: function inject(view) {
      interactions$.inject(view.vtree$);
      return view;
    }
  };
})();

var intent = (function () {
  var removeTicker$ = Cycle.createStream(function (interactions$) {
    return interactions$.choose('.ticker', 'remove');
  });

  return {
    removeTicker$: removeTicker$,
    inject: function inject(user) {
      removeTicker$.inject(user.interactions$);
      return user;
    }
  };
})();

user.inject(view).inject(model).inject(intent).inject(user);
