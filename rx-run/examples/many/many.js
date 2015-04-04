
var manyUser = (function () {
  var interactions$ = Cycle.createStream(function (vtree$) {
    return Cycle.render(vtree$, '.js-container').interactions$;
  });

  return {
    interactions$: interactions$,
    inject: function inject(view) {
      interactions$.inject(view.vtree$);
      return view;
    }
  };
})();

manyUser.inject(manyView).inject(manyModel).inject(manyIntent).inject(manyUser);
