
var manyUser = (function () {
  var interaction$ = Cycle.createStream(function (vtree$) {
    return Cycle.render(vtree$, '.js-container').interaction$;
  });

  return {
    interaction$: interaction$,
    inject: function inject(view) {
      interaction$.inject(view.vtree$);
      return view;
    }
  };
})();

manyUser.inject(manyView).inject(manyModel).inject(manyIntent).inject(manyUser);
