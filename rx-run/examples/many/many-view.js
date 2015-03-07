var h = Cycle.h;

var ManyView = Cycle.createView(function (Model) {
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

  return {
    vtree$: Model.get('items$')
      .map(function (itemsData) {
        return h('div.everything', {}, [
          vrenderTopButtons(),
          itemsData.map(vrenderItem)
        ]);
      })
  };
});
