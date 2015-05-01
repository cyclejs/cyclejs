var customElements = new Cycle.CustomElementsRegistry();
customElements.registerCustomElement('item', manyComponent);

var manyIntent = manyIntentFactory();
var manyModel = manyModelFactory(manyIntent);
var manyView = manyViewFactory(manyModel);

var reactiveNode = Cycle.render(
  manyView.vtree$,
  '.js-container',
  customElements
);

manyIntent.interactionChooser(reactiveNode.interactions);

reactiveNode.connect();
