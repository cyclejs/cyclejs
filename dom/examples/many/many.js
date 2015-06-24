function main(ext) {
  return manyView(manyModel(manyIntent(ext)));
}

Cycle.run(main, {
  DOM: CycleWeb.makeDOMDriver('.js-container', {
    'many-item': manyComponent
  })
});
