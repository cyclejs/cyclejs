Cycle.registerCustomElement('many-item', manyComponent);

Cycle.applyToDOM('.js-container', function computer(interactions) {
  return manyView(manyModel(manyIntent(interactions)));
});
