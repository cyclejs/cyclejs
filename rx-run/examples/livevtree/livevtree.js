var h = Cycle.h;
var Rx = Cycle.Rx;

function isObservable(i) {
  return (typeof i === 'object' && typeof i.subscribe === 'function');
}

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

function myComponent(color) {
  var x = Rx.Observable.interval(50)
    //.take(300)
    .map(function(i) { return h('h4','x'+i); });
  var y = Rx.Observable.interval(100)
    //.take(50)
    .map(function(i) { return h('h1','Y'+i); });
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

var Model = {
  color$: Rx.Observable.interval(1000)
    //.take(4)
    .map(makeRandomColor)
    .startWith('#000000')
};

var View = Cycle.createView(['color$'], function (model) {
  return {
    events: [],
    vtree$: model.color$.map(function (color) { return myComponent(color); }).switch()
  }
});

Cycle.createRenderer('.js-container').inject(View);
View.inject(Model);
