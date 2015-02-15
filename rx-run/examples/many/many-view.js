var h = Cycle.h;

var ManyView = Cycle.createView(function (Model) {
  function vrenderTopButtons() {
    return h('div.topButtons', [
      h('button.add-one-btn', 'Add New Item'),
      h('button.add-many-btn', 'Add Many Items')
    ]);
  }

  function vrenderItem(itemData) {
    return h('div.item', {
        style: {
          border: '1px solid #000',
          background: 'none repeat scroll 0% 0% ' + itemData.color,
          width: itemData.width + 'px',
          height: '70px',
          display: 'block',
          padding: '20px',
          margin: '10px 0px'
        }}, [
        h('input.color-field', {
          type: 'text',
          attributes: {'data-item-id': itemData.id, value: itemData.color}
        }),
        h('div.slider-container', [
          h('input.width-slider', {
            type: 'range', min:'200', max:'1000',
            attributes: {'data-item-id': itemData.id, value: itemData.width}
          })
        ]),
        h('div.width-content', String(itemData.width)),
        h('button.remove-btn', {attributes: {'data-item-id': itemData.id}}, 'Remove')
      ]
    );
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
