var h = Cycle.h;
var Rx = Cycle.Rx;

function makeRandomColor() {
  var hexColor = Math.floor(Math.random() * 16777215).toString(16);
  while (hexColor.length < 6) {
    hexColor = '0' + hexColor;
  }
  hexColor = '#' + hexColor;
  return hexColor;
}

var TickerModel = Cycle.createModel(['color$'], [], function (attributes, intent) {
  return {
    color$: attributes.color$,
    x$: Rx.Observable.interval(50),
    y$: Rx.Observable.interval(100)
  };
});

var TickerView = Cycle.createView(['color$', 'x$', 'y$'], function (model) {
  return {
    events: [],
    vtree$: Rx.Observable.combineLatest(model.color$, model.x$, model.y$, function (color, x, y) {
      return h('div.ticker', {style: {'color': color}}, [
        h('h4', 'x'+x+' '+color), h('h1','Y'+y+' '+color)
      ]);
    })
  };
});

var TickerIntent = Cycle.createIntent([], function (view) {
  return {};
});

var TickerDataFlowNode = Cycle.createDataFlowNode(['color$'], function (attributes) {
  var model = TickerModel.clone();
  var view = TickerView.clone();
  var intent = TickerIntent.clone();
  intent.inject(view);
  view.inject(model);
  model.inject(attributes, intent);
  return {
    vtree$: view.vtree$
  };
});

Cycle.registerCustomElement = function registerCustomElement(tagName, dataFlowNode) {
  Cycle._customElements = Cycle._customElements || {};
  Cycle._customElements[tagName] = function customElementConstructor(attributes) {
    this.type = 'Widget';
    this.attributes = {};
    for (prop in attributes) {
      if (attributes.hasOwnProperty(prop)) {
        this.attributes[prop] = attributes[prop];
      }
    }
  }
  Cycle._customElements[tagName].prototype.init = function initCustomElement() {
    var dfn = dataFlowNode.clone();
    var elem = document.createElement('div');
    elem.className = 'cycleCustomElementContainer-' + tagName;
    elem.cycleCustomElementAttributes = {};
    for (var i = dfn.inputInterfaces[0].length - 1; i >= 0; i--) {
      var attrStreamName = dfn.inputInterfaces[0][i];
      elem.cycleCustomElementAttributes[attrStreamName] = new Rx.Subject();
    };
    Cycle.createRenderer(elem).inject(dfn);
    dfn.inject(elem.cycleCustomElementAttributes);
    this.update(null, elem);
    return elem;
  }
  Cycle._customElements[tagName].prototype.update = function updateCustomElement(prev, elem) {
    for (prop in elem.cycleCustomElementAttributes) {
      var attrStreamName = prop;
      var attrName = prop.slice(0,-1);
      if (elem.cycleCustomElementAttributes.hasOwnProperty(attrStreamName) &&
        this.attributes.hasOwnProperty(attrName))
      {
        elem.cycleCustomElementAttributes[attrStreamName].onNext(
          this.attributes[attrName]
        );
      }
    }
  }
};

Cycle.registerCustomElement('ticker', TickerDataFlowNode);

// function Ticker(attributes) {
//   this.type = 'Widget';
//   this.attributes = {};
//   for (prop in attributes) {
//     if (attributes.hasOwnProperty(prop)) {
//       this.attributes[prop] = attributes[prop];
//     }
//   }
// }

// Ticker.prototype.init = function () {
//   var dataFlowNode = TickerDataFlowNode.clone();
//   var elem = document.createElement('div');
//   elem.className = 'tickerContainer';
//   elem.cycleCustomElementAttributes = {};
//   for (var i = dataFlowNode.inputInterfaces[0].length - 1; i >= 0; i--) {
//     var attrStreamName = dataFlowNode.inputInterfaces[0][i];
//     elem.cycleCustomElementAttributes[attrStreamName] = new Rx.Subject();
//   };
//   Cycle.createRenderer(elem).inject(dataFlowNode);
//   dataFlowNode.inject(elem.cycleCustomElementAttributes);
//   this.update(null, elem);
//   return elem;
// }

// Ticker.prototype.update = function (prev, elem) {
//   for (prop in elem.cycleCustomElementAttributes) {
//     var attrStreamName = prop;
//     var attrName = prop.slice(0,-1);
//     if (elem.cycleCustomElementAttributes.hasOwnProperty(attrStreamName) &&
//       this.attributes.hasOwnProperty(attrName))
//     {
//       elem.cycleCustomElementAttributes[attrStreamName].onNext(
//         this.attributes[attrName]
//       );
//     }
//   }
// }

var Model = {
  color$: Rx.Observable.interval(1000)
    //.take(1)
    .map(makeRandomColor)
    .startWith('#000000')
};

function replaceCustomElements(vtree) {
  // Silently ignore corner cases
  if (typeof vtree === 'undefined' || 
    typeof Cycle._customElements === 'undefined' ||
    !Array.isArray(vtree.children))
  {
    return;
  }
  for (var i = vtree.children.length - 1; i >= 0; i--) {
    var tagName = vtree.children[i].tagName;
    if (Cycle._customElements.hasOwnProperty(tagName)) {
      vtree.children[i] = new Cycle._customElements[tagName](
        vtree.children[i].properties.attributes
      );
    } else {
      replaceCustomElements(vtree.children[i]);
    }
  };
}

var View = Cycle.createView(['color$'], function (model) {
  return {
    events: [],
    vtree$: model.color$.map(function (color) { 
      return h('div#the-view', [
        h('ticker', {attributes: {'color': color}})
      ]);
    }).map(function (vtree) { replaceCustomElements(vtree); return vtree; })
  }
});

Cycle.createRenderer('.js-container').inject(View);
View.inject(Model);
