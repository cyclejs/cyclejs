function main(ext) {
  return manyView(manyModel(manyIntent(ext)));
}

Cycle.run(main, {
  DOM: CycleDOM.makeDOMDriver('.js-container', {
    'many-item': manyComponent
  })
});
