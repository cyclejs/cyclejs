var h = Cycle.h;

// This example tests 3 issues:
// - Whether custom events from a custom element are caught by the parent View/User
// - Whether custom events on a custom element are catchable even when the root element is
//   not a div (in this case, an h2).
// - Whether Model streams internal to a custom element can be used in the custom
//   element's return object. E.g. model.foo$.

Cycle.registerCustomElement('inner-elem', function (rootElem$, props) {
  var model = (function () {
    var foo$ = Cycle.createStream(function (propsFoo$) {
      return propsFoo$.shareReplay(1);
    });
    var content$ = Cycle.createStream(function (refreshData$, content$) {
      return refreshData$
        .map(function () { return Math.round(Math.random() * 1000); })
        .merge(content$)
        .shareReplay(1);
    });

    return {
      foo$: foo$,
      content$: content$,
      inject: function inject(props, intent) {
        foo$.inject(props.get('foo$'));
        content$.inject(intent.refreshData$, props.get('content$'));
        return [props, intent];
      }
    };
  })();

  var view = (function () {
    var vtree$ = Cycle.createStream(function (content$) {
      return content$
        .map(function (content) {
          return h('h2.innerRoot', {
            style: {
              margin: '10px',
              background: '#ececec',
              padding: '5px',
              cursor: 'pointer',
              display: 'inline-block'
            }
          }, String(content));
        });
    });

    return {
      vtree$: vtree$,
      inject: function inject(model) {
        vtree$.inject(model.content$);
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
    var refreshData$ = Cycle.createStream(function (interaction$) {
      return interaction$.choose('.innerRoot', 'click').map(function () { return 'x'; });
    });

    return {
      refreshData$: refreshData$,
      inject: function inject(user) {
        refreshData$.inject(user.interaction$);
        return user;
      }
    };
  })();

  user.inject(view).inject(model).inject(props, intent)[1].inject(user);

  return {
    wasRefreshed$: intent.refreshData$.delay(500),
    contentOnRefresh$: intent.refreshData$
      .withLatestFrom(model.content$, function (x, y) { return y; }),
    fooOnRefresh$: intent.refreshData$
      .withLatestFrom(model.foo$, function (x, y) { return y; })
  };
});

var model = (function () {
  var color$ = Cycle.createStream(function (changeColor$) {
    return changeColor$.startWith('#000000');
  });

  return {
    color$: color$,
    inject: function inject(intent) {
      color$.inject(intent.changeColor$);
      return intent;
    }
  };
})();

var view = (function () {
  var vtree$ = Cycle.createStream(function (color$) {
    return color$
      .map(function (color) {
        return h('div.outer', {
            style: {
              margin: '40px',
              border: '1px solid #323232',
              padding: '20px'}},
          [
            h('inner-elem.inner', {foo: 17, content: 153, key: 1}),
            h('p', {style: {color: color}}, String(color)),
            h('p', '(Please check also the logs)')]);
      });
  });

  return {
    vtree$: vtree$,
    inject: function inject(model) {
      vtree$.inject(model.color$);
      return model;
    }
  };
})();

var user = (function () {
  var interaction$ = Cycle.createStream(function (vtree$) {
    return Cycle.render(vtree$, '.js-container').interaction$;
  });

  return {
    interaction$: interaction$,
    inject: function inject(view) {
      interaction$.inject(view.vtree$);
      return view;
    }
  };
})();

console.info('You should see both \'foo: ...\' and \'content: ...\' ' +
  'logs every time you click on the inner box.'
);
user.interaction$.choose('.inner', 'fooOnRefresh').subscribe(function (ev) {
  console.log('foo: ' + ev.data);
});
user.interaction$.choose('.inner', 'contentOnRefresh').subscribe(function (ev) {
  console.log('content: ' + ev.data);
});

var intent = (function () {
  function makeRandomColor() {
    var hexColor = Math.floor(Math.random() * 16777215).toString(16);
    while (hexColor.length < 6) {
      hexColor = '0' + hexColor;
    }
    hexColor = '#' + hexColor;
    return hexColor;
  }

  var changeColor$ = Cycle.createStream(function (interaction$) {
    return interaction$.choose('.inner', 'wasRefreshed').map(makeRandomColor);
  });

  return {
    changeColor$: changeColor$,
    inject: function inject(user) {
      changeColor$.inject(user.interaction$);
      return user;
    }
  };
})();

user.inject(view).inject(model).inject(intent).inject(user);
