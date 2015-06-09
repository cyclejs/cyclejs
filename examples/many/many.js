function main(ext) {
  return manyView(manyModel(manyIntent(ext)));
}

Cycle.run(main, {
  DOM: Cycle.makeDOMDriver('.js-container', {
    'many-item': manyComponent
  })
});
