var h = Cycle.h;
var Rx = Cycle.Rx;
var VirtualDOM = Cycle.VirtualDOM;

// NOT USED
function isObservable(i) {
  return (typeof i === 'object' && typeof i.subscribe === 'function');
}

// NOT USED
function c(tagName, properties, children) {
  var atLeastOneChildObservable = !children.every(function (i) { return !isObservable(i); });

  if (atLeastOneChildObservable) {
    // TODO make sure every item in children is an Observable

    return Rx.Observable.combineLatest(children, function() {
      var args = Array.prototype.slice.call(arguments);
      return c(tagName, properties, args);
    });
  }
  else {
    return h(tagName, properties, children);
  }
}

// NOT USED
function myComponent(color) {
  var x = Rx.Observable.interval(50)
    //.take(300)
    .map(function(i) { return h('h4','x'+i+' '+color); });
  var y = Rx.Observable.interval(100)
    //.take(50)
    .map(function(i) { return h('h1','Y'+i+' '+color); });
  return c('div', {style: {'color': color}}, [x, y]);
}

function makeRandomColor() {
  var hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

function Ticker(color) {
  this.type = 'Widget';
  this.color = color;
}

Ticker.prototype.init = function () {
  var elem = document.createElement('div');
  var rootNode = document.createElement('div');
  elem.appendChild(rootNode);
  elem.color$ = new Rx.Subject();
  var x$ = Rx.Observable.interval(50);
  var y$ = Rx.Observable.interval(100);
  Rx.Observable.combineLatest(elem.color$, x$, y$, function(color, x, y) {
    return h('div', {style:{'color': color}}, [
      h('h4', 'x'+x+' '+color), h('h1','Y'+y+' '+color)
    ]);
  })
  .startWith(h())
  .bufferWithCount(2, 1)
  .subscribe(function (buffer) {
    var oldVTree = buffer[0];
    var newVTree = buffer[1];
    if (typeof newVTree === 'undefined') {
      return;
    }
    rootNode = VirtualDOM.patch(rootNode, VirtualDOM.diff(oldVTree, newVTree));
  });
  return elem;
}

Ticker.prototype.update = function (prev, elem) {
  elem.color$.onNext(this.color);
}

var Model = {
  color$: Rx.Observable.interval(1000)
    //.take(1)
    .map(makeRandomColor)
    .startWith('#000000')
};

var View = Cycle.createView(['color$'], function (model) {
  return {
    events: [],
    vtree$: model.color$.map(function (color) { return new Ticker(color); })
  }
});

Cycle.createRenderer('.js-container').inject(View);
View.inject(Model);
