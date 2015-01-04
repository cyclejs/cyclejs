
var h = Cycle.h;

function vrenderTopButtons() {
  return h('div.topButtons', {}, [
    h('button', {'ev-click': 'addOneClicks$'}, 'Add New Item'),
    h('button', {'ev-click': 'addManyClicks$'}, 'Add Many Items')
  ]);
}

function vrenderItem(itemData) {
  return h('div', {
      style: {
        'border': '1px solid #000',
        'background': 'none repeat scroll 0% 0% ' + itemData.color,
        'width': itemData.width + 'px',
        'height': '70px',
        'display': 'block',
        'padding': '20px',
        'margin': '10px 0px'
      }}, [
      h('input', {
        type: 'text',
        'attributes': {'data-item-id': itemData.id, value: itemData.color},
        'ev-input': 'itemColorChanged$'
      }),
      h('div', [
        h('input', {
          type: 'range', min:'200', max:'1000',
          'attributes': {'data-item-id': itemData.id, value: itemData.width},
          'ev-input': 'itemWidthChanged$'
        })
      ]),
      h('div', String(itemData.width)),
      h('button', {
        'attributes': {'data-item-id': itemData.id},
        'ev-click': 'removeClicks$'
      }, 'Remove')
    ]
  );
}

var ManyView = Cycle.createView(function (model) {
  return {
    events: ['itemWidthChanged$', 'itemColorChanged$', 'removeClicks$',
      'addOneClicks$', 'addManyClicks$'
    ],
    vtree$: model.get('items$')
      .map(function (itemsData) {
        return h('div.everything', {}, [
          vrenderTopButtons(),
          itemsData.map(vrenderItem)
        ]);
      })
  };
});
