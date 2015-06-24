var h = CycleWeb.h;

// This example tests 3 issues:
// - Whether custom events from a custom element are caught by the parent View/User
// - Whether custom events on a custom element are catchable even when the root element is
//   not a div (in this case, an h2).
// - Whether Model streams internal to a custom element can be used in the custom
//   element's return object. E.g. model.foo$.

function innerElem(ext) {
  var refreshData$ = ext.UI.get('.innerRoot', 'click').share();
  var foo$ = ext.props.get('foo');
  var content$ = refreshData$
    .map(function () { return Math.round(Math.random() * 1000); })
    .merge(ext.props.get('content'))
    .shareReplay(1);
  var vtree$ = content$
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

  return {
    UI: vtree$,
    events: {
      wasRefreshed: refreshData$.delay(500).share(),
      contentOnRefresh: refreshData$
        .withLatestFrom(content$, function (x, y) { return y; }),
      fooOnRefresh: refreshData$
        .withLatestFrom(foo$, function (x, y) { return y; })
    }
  };
}

function makeRandomColor() {
  var hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

function main(ext) {
  var vtree$ = ext.UI.get('.inner', 'wasRefreshed')
    .map(makeRandomColor)
    .startWith('#000000')
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
  return {
    UI: vtree$
  };
}

var interaction = Cycle.run(main, {
  UI: CycleWeb.makeDOMDriver('.js-container', {'inner-elem': innerElem})
});
var responses = interaction[1];

console.info('You should see both \'foo: ...\' and \'content: ...\' ' +
  'logs every time you click on the inner box.'
);
responses.UI.get('.inner', 'fooOnRefresh').subscribe(function (ev) {
  console.log('foo: ' + ev.detail);
});
responses.UI.get('.inner', 'contentOnRefresh').subscribe(function (ev) {
  console.log('content: ' + ev.detail);
});

