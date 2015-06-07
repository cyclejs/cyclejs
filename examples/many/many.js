function app(ext) {
  return manyView(manyModel(manyIntent(ext)));
}

Cycle.run(app, {
  dom: Cycle.makeDOMDriver('.js-container', {
    'many-item': manyComponent
  })
});
