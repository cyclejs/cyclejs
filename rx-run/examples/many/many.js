function app(ext) {
  return manyView(manyModel(manyIntent(ext)));
}

Cycle.run(app, {
  DOM: Cycle.makeDOMDriver('.js-container', {
    'many-item': manyComponent
  })
});
