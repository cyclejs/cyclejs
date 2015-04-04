var h = Cycle.h;

var manyView = (function () {
  function vrenderTopButtons() {
    return h('div.topButtons', [
      h('button.add-one-btn', 'Add New Item'),
      h('button.add-many-btn', 'Add Many Items')
    ]);
  }

  function vrenderItem(itemData) {
    return h('item.item', {
      itemid: itemData.id,
      color:  itemData.color,
      width:  itemData.width,
      key: itemData.id
    });
  }

  var vtree$ = Cycle.createStream(function (items$) {
    return items$
      .map(function (itemsData) {
        return h('div.everything', {}, [
          vrenderTopButtons(),
          itemsData.map(vrenderItem)
        ]);
      });
  });

  return {
    vtree$: vtree$,
    inject: function inject(model) {
      vtree$.inject(model.items$);
      return model;
    }
  };
})();
