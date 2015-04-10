var h = Cycle.h;

function model(refreshData$) {
  return refreshData$
    .map(function () { return Math.round(Math.random() * 1000); })
    .startWith(135);
}

function view(data$) {
  return data$
    .map(function (data) {
      return h('div.box', {
        style: {
          margin: '10px',
          background: '#ececec',
          padding: '5px',
          cursor: 'pointer',
          display: 'inline-block'
        }
      }, String(data));
    });
}

function createUser(container) {
  return function user(vtree$) {
    return Cycle.render(vtree$, container).interactions$;
  };
}

function intent(interactions$) {
  return interactions$.choose('.box', 'click').map(function () { return 'x'; });
}

var fooName$ = Cycle.createStream(model);
var fooVtree$ = Cycle.createStream(view);
var fooInteractions$ = Cycle.createStream(createUser('.js-container1'));
var fooChangeName$ = Cycle.createStream(intent);

var barName$ = Cycle.createStream(model);
var barVtree$ = Cycle.createStream(view);
var barInteractions$ = Cycle.createStream(createUser('.js-container2'));
var barChangeName$ = Cycle.createStream(intent);

fooInteractions$
  .inject(fooVtree$)
  .inject(fooName$)
  .inject(fooChangeName$)
  .inject(fooInteractions$);

barInteractions$
  .inject(barVtree$)
  .inject(barName$)
  .inject(barChangeName$)
  .inject(barInteractions$);
